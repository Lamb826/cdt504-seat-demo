"use strict";

const { t } = window.SeatLanguage;
const KEY = "seatCheckinRecord";
const floors = window.LIBRARY_FLOORS;
const stateMarks = { empty: "✓", occ: "•", away: "–" };
const floorTabs = document.getElementById("floor-tabs");
const zoneTabs = document.getElementById("zone-tabs");
const canvas = document.getElementById("plan-canvas");
const planImage = document.getElementById("plan-image");
const markers = document.getElementById("plan-markers");
const seatList = document.getElementById("seat-list");
const dialog = document.getElementById("seat-dialog");
const checkin = document.getElementById("seat-checkin");
const counters = Object.fromEntries(Object.keys(stateMarks).map(state => [state, document.getElementById("stat-" + state)]));
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
  setText("seat-dialog-title", t(info.state));
  const descriptions = {
    empty: "emptyDescription",
    occ: info.own ? "ownOccupiedDescription" : "demoOccupiedDescription",
    away: info.own ? "ownAwayDescription" : "demoAwayDescription",
  };
  const area = `${t(floor.labelKey)} · ${t(zone.labelKey)}`;
  const hold = info.leftMin == null ? "" : " " + t("heldFor", { minutes: info.leftMin });
  setText("seat-dialog-detail", `${area} — ${t(descriptions[info.state])}${hold}`);
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
    heading.textContent = t(zone.labelKey);
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
  setText("layout-caption", chosen
    ? t("zoneCount", { zone: t(chosen.labelKey), count: chosen.seats.length })
    : t("floorCount", { count: floorSeats.length }));
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
  planImage.src = floor.image;
  renderFloor(-1);
}

function renderFloor(zone) {
  setText("layout-heading", `${floor.label} · ${t(floor.labelKey)}`);
  planImage.alt = t("floorAlt", { floor: floor.label });
  zoneTabs.replaceChildren(
    newButton("zone-tab", t("wholeFloor"), () => selectZone(-1)),
    ...floor.zones.map((item, index) => newButton("zone-tab", t(item.labelKey), () => selectZone(index))),
  );
  selectZone(zone);
}

function renderStates() {
  const session = readSession();
  const counts = { empty: 0, occ: 0, away: 0 };
  for (const seat of floorSeats) counts[seatState(seat, session).state]++;
  for (const [state, counter] of Object.entries(counters)) counter.textContent = counts[state];
  for (const { seat, dot, label } of visibleSeats) {
    const { state, leftMin } = seatState(seat, session);
    const remaining = leftMin == null ? "" : " · " + t("remaining", { minutes: leftMin });
    const detail = `${seat.id} · ${t(state)}${remaining}`;
    for (const [node, base] of [[dot, "plan-dot"], [label, "seat-label"]]) {
      node.className = `${base} is-${state}`;
      node.dataset.state = state;
      node.title = detail;
      node.setAttribute("aria-label", detail);
    }
    dot.textContent = stateMarks[state];
  }
  if (selected && dialog.open) updateDialog(seatState(selected.seat, session));
}

for (const item of floors) {
  const button = newButton("floor-tab", "", () => selectFloor(item));
  button.dataset.floor = item.id;
  const title = document.createElement("strong");
  title.textContent = item.label;
  const name = document.createElement("small");
  name.textContent = t(item.labelKey);
  button.append(title, name);
  floorTabs.append(button);
  floorButtons.set(item.id, button);
}
document.getElementById("refresh-map").addEventListener("click", () => {
  renderStates();
  setText("map-feedback", t("mapRefreshed", { floor: floor.label }));
});
dialog.addEventListener("close", () => { selected = null; });
window.addEventListener("pageshow", renderStates);
window.addEventListener("storage", event => {
  if (event.key === KEY || event.key === null) renderStates();
});
window.addEventListener("seatlanguagechange", () => {
  for (const item of floors) floorButtons.get(item.id).querySelector("small").textContent = t(item.labelKey);
  setText("map-feedback", "");
  renderFloor(zoneIndex);
});
selectFloor(floor, false);
setInterval(renderStates, 10000);
