"use strict";

const KEY = "seatCheckinRecord";
const floors = window.LIBRARY_FLOORS;
const labels = {
  empty: { text: "空位", mark: "✓" },
  occ: { text: "在座", mark: "•" },
  away: { text: "暂离", mark: "–" },
};
const floorTabs = document.getElementById("floor-tabs");
const zoneTabs = document.getElementById("zone-tabs");
const canvas = document.getElementById("plan-canvas");
const planImage = document.getElementById("plan-image");
const markers = document.getElementById("plan-markers");
const seatList = document.getElementById("seat-list");
const dialog = document.getElementById("seat-dialog");
const checkin = document.getElementById("seat-checkin");
const counters = Object.fromEntries(Object.keys(labels).map(state => [state, document.getElementById("stat-" + state)]));
const floorParam = new URLSearchParams(location.search).get("floor");
let floor = floors.find(item => item.id === floorParam) ?? floors[0];
let zoneIndex = -1;
let selected = null;
let visibleSeats = [];
let floorSeats = [];
const floorButtons = new Map();

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function seatState(seat, session) {
  if (session?.seat === seat.id && !session.autoOut) {
    if (!session.tempUntil) return { state: "occ", own: true };
    const remaining = session.tempUntil - Date.now();
    if (remaining > 0) return { state: "away", leftMin: Math.ceil(remaining / 60000), own: true };
  }
  return seat;
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function updateDialog(info) {
  const { seat, zone } = selected;
  setText("seat-dialog-code", `${floor.label} · ${seat.id}`);
  setText("seat-dialog-title", labels[info.state].text);
  let detail = `${floor.name} · ${zone.name}。`;
  if (info.state === "empty") detail += "到桌后，可用此编号演示签到。";
  if (info.state === "occ") detail += info.own ? "这是你在本机签到的座位。" : "模拟场景中，此座位正在使用。";
  if (info.state === "away") {
    detail += info.own ? "你的座位处于暂离状态。" : "模拟场景中，使用者暂时离开。";
    if (info.leftMin != null) detail += `预计保留约 ${info.leftMin} 分钟。`;
  }
  setText("seat-dialog-detail", detail);
  checkin.hidden = info.state !== "empty";
  const query = new URLSearchParams({ seat: seat.id, from: "map", floor: floor.id });
  checkin.href = "checkin.html?" + query;
}

function showSeat(seat, zone) {
  selected = { seat, zone };
  updateDialog(seatState(seat, readSession()));
  dialog.showModal();
}

function newButton(css, text, activate) {
  const button = document.createElement("button");
  button.className = css;
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", activate);
  return button;
}

function makeMarker(seat, zone, [x, y, w, h]) {
  const button = newButton("plan-dot", "", () => showSeat(seat, zone));
  button.dataset.seat = seat.id;
  button.style.left = (seat.x - x) / w * 100 + "%";
  button.style.top = (seat.y - y) / h * 100 + "%";
  return button;
}

function makeSeatLabel(seat, zone) {
  const button = newButton("seat-label", "", () => showSeat(seat, zone));
  button.dataset.seatRef = seat.id;
  const dot = document.createElement("i");
  dot.className = "state-dot";
  dot.setAttribute("aria-hidden", "true");
  button.append(dot, seat.id);
  return button;
}

function selectZone(index) {
  zoneIndex = index;
  const chosen = floor.zones[index];
  const bounds = chosen?.bounds ?? [0, 0, 1, 1];
  const [x, y, w, h] = bounds;
  canvas.style.aspectRatio = String((floor.width * w) / (floor.height * h));
  canvas.classList.toggle("zoomed", Boolean(chosen));
  planImage.style.width = 100 / w + "%";
  planImage.style.left = -100 * x / w + "%";
  planImage.style.top = -100 * y / h + "%";
  markers.replaceChildren();
  seatList.replaceChildren();
  visibleSeats = [];
  for (const zone of chosen ? [chosen] : floor.zones) {
    const section = document.createElement("section");
    section.className = "seat-group";
    const heading = document.createElement("h3");
    heading.textContent = zone.name;
    const list = document.createElement("div");
    list.className = "seat-group-buttons";
    section.append(heading, list);
    seatList.append(section);
    for (const seat of zone.seats) {
      const dot = makeMarker(seat, zone, bounds);
      const label = makeSeatLabel(seat, zone);
      markers.append(dot);
      list.append(label);
      visibleSeats.push({ seat, dot, label });
    }
  }
  for (const [buttonIndex, button] of [...zoneTabs.children].entries()) {
    button.setAttribute("aria-pressed", String(buttonIndex === zoneIndex + 1));
  }
  setText("layout-caption", chosen ? `${chosen.name} · ${chosen.seats.length} 个演示座位` : `${floorSeats.length} 个演示座位 · 可放大指定区域`);
  renderStates();
}

function selectFloor(next, updateUrl = true) {
  if (dialog.open) dialog.close();
  floor = next;
  floorSeats = floor.zones.flatMap(zone => zone.seats);
  for (const [id, button] of floorButtons) {
    button.setAttribute("aria-pressed", String(id === floor.id));
  }
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("floor", floor.id);
    history.replaceState(null, "", url);
  }
  setText("layout-heading", `${floor.label} · ${floor.name}`);
  planImage.src = floor.image;
  planImage.alt = `岭南大学图书馆 ${floor.label} 平面布局`;
  zoneTabs.replaceChildren(
    newButton("zone-tab", "整层", () => selectZone(-1)),
    ...floor.zones.map((zone, index) => newButton("zone-tab", zone.name, () => selectZone(index))),
  );
  selectZone(-1);
}

function renderStates() {
  const session = readSession();
  const counts = { empty: 0, occ: 0, away: 0 };
  for (const seat of floorSeats) counts[seatState(seat, session).state]++;
  for (const [state, counter] of Object.entries(counters)) counter.textContent = counts[state];
  for (const { seat, dot, label } of visibleSeats) {
    const { state, leftMin } = seatState(seat, session);
    const detail = `${seat.id} · ${labels[state].text}${leftMin == null ? "" : ` · 约 ${leftMin} 分钟`}`;
    for (const [node, base] of [[dot, "plan-dot"], [label, "seat-label"]]) {
      node.className = `${base} is-${state}`;
      node.dataset.state = state;
      node.title = detail;
      node.setAttribute("aria-label", detail);
    }
    dot.textContent = labels[state].mark;
  }
  if (selected && dialog.open) updateDialog(seatState(selected.seat, session));
}

for (const item of floors) {
  const button = newButton("floor-tab", "", () => selectFloor(item));
  button.dataset.floor = item.id;
  const title = document.createElement("strong");
  title.textContent = item.label;
  const name = document.createElement("small");
  name.textContent = item.name;
  button.append(title, name);
  floorTabs.append(button);
  floorButtons.set(item.id, button);
}
document.getElementById("refresh-map").addEventListener("click", () => {
  renderStates();
  setText("map-feedback", `${floor.label} 本机座位状态已刷新`);
});
dialog.addEventListener("close", () => { selected = null; });
window.addEventListener("pageshow", renderStates);
window.addEventListener("storage", event => {
  if (event.key === KEY || event.key === null) renderStates();
});
selectFloor(floor, false);
setInterval(renderStates, 10000);
