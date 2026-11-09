"use strict";

const { t } = window.SeatLanguage;
const KEY = "seatCheckinRecord";
const MINUTE = 60_000;
const WARN_BEFORE = 10;
const endpoint = window.SEAT_CONFIG.endpoint.trim();
const params = new URLSearchParams(location.search);
const requestedSeat = (params.get("seat") ?? "").trim().toUpperCase();
const fromMap = params.get("from") === "map";
const demoCode = /^(1F|MF|2F|3F)-[A-Z]\d{2}$/;
const returnFloor = demoCode.exec(requestedSeat)?.[1].toLowerCase();
const $ = id => document.getElementById(id);
const views = ["homeView", "checkinView", "awayView", "checkoutView", "doneBox"];

let currentView = "homeView";
let actionSession = null;
let warnedFor = null;
let notificationSetup = false;
let doneContent = null;
let checkinError = null;

function readRecord() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return value && typeof value.seat === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeRecord(record) {
  localStorage.setItem(KEY, JSON.stringify(record));
}

function publish(action, record, extras = {}) {
  if (!endpoint || demoCode.test(record.seat)) return;
  const { name, sid, seat } = record;
  fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    credentials: "omit",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ action, name, sid, seat, ts: Date.now(), ...extras }),
  }).catch(() => {});
}

async function notify(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.active) {
      await registration.showNotification(title, { body, lang: document.documentElement.lang, icon: "icon-192.png" });
    } else {
      new Notification(title, { body, lang: document.documentElement.lang });
    }
  } catch {
    // In-page warnings still work when the browser declines system notifications.
  }
}

function currentRecord() {
  const record = readRecord();
  if (!record || record.autoOut || !record.tempUntil || record.tempUntil > Date.now()) return record;
  const released = { ...record, tempUntil: null, autoOut: Date.now() };
  writeRecord(released);
  publish("autorelease", released);
  void notify(t("releaseNotification"), t("releaseNotificationDetail", released));
  return released;
}

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
function displayTime(value) {
  return Number.isFinite(value) ? clock.format(new Date(value)) : "—";
}

function setText(id, value) {
  const el = $(id);
  if (el.textContent !== value) el.textContent = value;
}

function homeStatus(record) {
  if (!record) return ["idle", t("notCheckedIn"), t("checkinPrompt")];
  if (record.autoOut) {
    return ["released", t("releasedStatus", record), t("releasedDetail", { time: displayTime(record.autoOut) })];
  }
  if (record.tempUntil) {
    const left = Math.max(1, Math.ceil((record.tempUntil - Date.now()) / MINUTE));
    const warning = left <= WARN_BEFORE;
    return [
      warning ? "warning" : "away",
      t(warning ? "warningStatus" : "awayStatus", record),
      t("returnBy", { time: displayTime(record.tempUntil) }),
      t("minutes", { minutes: left }),
    ];
  }
  return ["occupied", t("occupiedStatus", record), t("checkedInAt", { time: displayTime(record.checkinAt) })];
}

function renderHome(record = currentRecord()) {
  const [state, title, detail, time] = homeStatus(record);
  $("statusCard").dataset.state = state;
  setText("statusTitle", title);
  setText("statusDetail", detail);
  setText("statusTime", time ?? "");
  $("statusTime").hidden = !time;
  const active = Boolean(record && !record.autoOut);
  const away = active && Boolean(record.tempUntil);
  $("btnIn").hidden = active;
  $("btnAway").hidden = away;
  $("btnAway").disabled = !active;
  $("btnOut").disabled = !active;
  $("btnBack").hidden = !away;
}

function show(view, focus = true) {
  currentView = view;
  for (const id of views) $(id).hidden = id !== view;
  if (focus) {
    const heading = $(view).querySelector("h1");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function goHome() {
  renderHome();
  show("homeView");
}

function renderDone() {
  const { eyebrow, title, message, values } = doneContent;
  setText("doneEyebrow", t(eyebrow));
  setText("doneTitle", t(title));
  setText("doneMsg", t(message, values));
  updateNotificationSettings();
}

function showDone(eyebrow, title, message, values, notifications = false) {
  doneContent = { eyebrow, title, message, values };
  notificationSetup = notifications;
  renderDone();
  show("doneBox");
}

function updateNotificationSettings() {
  $("notifyOptions").hidden = !notificationSetup;
  const available = window.isSecureContext && "Notification" in window;
  const permission = available ? Notification.permission : "unavailable";
  $("btnEnableNotify").hidden = permission !== "default";
  const hints = {
    default: "notifyDefault",
    granted: "notifyGranted",
    denied: "notifyDenied",
    unavailable: "notifyUnavailable",
  };
  setText("notifyHint", t(hints[permission]));
}

function goCheckin(focus = true) {
  const record = currentRecord();
  if (record && !record.autoOut) {
    goHome();
    return;
  }
  const seat = $("seat");
  seat.value = requestedSeat || record?.seat || "";
  seat.readOnly = Boolean(requestedSeat);
  renderCheckinText();
  if (record?.autoOut) {
    for (const id of ["name", "sid", "email"]) $(id).value = record[id] ?? "";
  }
  checkinError = null;
  $("formError").hidden = true;
  show("checkinView", focus);
}

function renderCheckinText() {
  setText("checkinIntro", t(fromMap ? "demoCheckinIntro" : "deskIntro"));
  const linkedSeat = fromMap ? "seatFromMap" : "seatFromCode";
  setText("seatHint", t(requestedSeat ? linkedSeat : "seatManual"));
  setText("emailHint", t(endpoint && !demoCode.test(requestedSeat) ? "emailService" : "demoEmail"));
  if (checkinError) setText("formError", t(...checkinError));
}

function onCheckin(event) {
  event.preventDefault();
  const existing = currentRecord();
  const record = {
    seat: (requestedSeat || $("seat").value).trim().toUpperCase(),
    name: $("name").value.trim(),
    sid: $("sid").value.trim(),
    email: $("email").value.trim(),
    checkinAt: Date.now(),
    tempUntil: null,
    autoOut: null,
  };
  checkinError = null;
  if (existing && !existing.autoOut) checkinError = ["existingCheckin", existing];
  else if (!record.name || !record.sid || !record.seat) checkinError = ["requiredDetails"];
  else if ($("email").validity.typeMismatch) checkinError = ["invalidEmail"];
  if (checkinError) {
    setText("formError", t(...checkinError));
    $("formError").hidden = false;
    return;
  }
  writeRecord(record);
  publish("checkin", record, { email: record.email });
  $("checkinForm").reset();
  showDone("checkinEyebrow", "checkinDone", "checkinDoneDetail", record, true);
}

function mealTime() {
  const date = new Date();
  const time = date.getHours() * 100 + date.getMinutes();
  return (time >= 1100 && time <= 1330) || (time >= 1700 && time <= 1930);
}

function goAway() {
  const record = currentRecord();
  if (!record || record.autoOut || record.tempUntil) return goHome();
  actionSession = record;
  const meal = mealTime();
  const minutes = meal ? [10, 20, 30, 45, 60] : [10, 20, 30];
  const choices = minutes.map((minute, index) => {
    const option = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "duration";
    input.value = String(minute);
    input.checked = index === minutes.length - 1;
    const label = document.createElement("span");
    label.textContent = t("minutes", { minutes: minute });
    option.append(input, label);
    return option;
  });
  $("durationRow").replaceChildren(...choices);
  setText("mealNote", t(meal ? "mealBreak" : "standardBreak"));
  show("awayView");
}

function recordForAction() {
  const record = currentRecord();
  if (!record || record.autoOut || record.checkinAt !== actionSession?.checkinAt || record.seat !== actionSession?.seat) {
    goHome();
    return null;
  }
  return record;
}

function onAway(event) {
  event.preventDefault();
  const record = recordForAction();
  if (!record || record.tempUntil) return goHome();
  const minutes = Number(new FormData(event.target).get("duration"));
  if (!Number.isFinite(minutes) || minutes < 1) return;
  record.tempUntil = Date.now() + minutes * MINUTE;
  writeRecord(record);
  publish("away", record, { tempUntil: record.tempUntil, email: record.email });
  showDone("breakEyebrow", "awayDone", "awayDoneDetail", { seat: record.seat, time: displayTime(record.tempUntil) });
}

function resume() {
  const record = currentRecord();
  if (!record || record.autoOut || !record.tempUntil) return goHome();
  record.tempUntil = null;
  writeRecord(record);
  publish("resume", record);
  showDone("resumeEyebrow", "resumeDone", "resumeDoneDetail", record);
}

function goCheckout() {
  const record = currentRecord();
  if (!record || record.autoOut) return goHome();
  actionSession = record;
  renderCheckoutText();
  show("checkoutView");
}

function renderCheckoutText() {
  const { seat, checkinAt } = actionSession;
  setText("checkoutInfo", t("checkoutDetail", { seat, time: displayTime(checkinAt) }));
}

function checkout() {
  const record = recordForAction();
  if (!record) return;
  localStorage.removeItem(KEY);
  publish("checkout", record);
  showDone("checkoutEyebrow", "checkoutDone", "checkoutDoneDetail", record);
}

function tick() {
  const record = currentRecord();
  if (currentView === "homeView") renderHome(record);
  const end = record?.tempUntil;
  if (end && end - Date.now() <= WARN_BEFORE * MINUTE && warnedFor !== end) {
    const warningKey = `warned_${end}`;
    warnedFor = end;
    if (localStorage.getItem(warningKey)) return;
    localStorage.setItem(warningKey, "1");
    const minutes = Math.max(1, Math.ceil((end - Date.now()) / MINUTE));
    void notify(t("warningNotification"), t("warningNotificationDetail", { seat: record.seat, minutes }));
  }
}

$("btnIn").addEventListener("click", () => goCheckin());
$("btnAway").addEventListener("click", goAway);
$("btnOut").addEventListener("click", goCheckout);
$("btnBack").addEventListener("click", resume);
$("confirmCheckout").addEventListener("click", checkout);
$("checkinForm").addEventListener("submit", onCheckin);
$("awayForm").addEventListener("submit", onAway);
document.querySelectorAll("[data-home]").forEach(button => button.addEventListener("click", goHome));
$("btnEnableNotify").addEventListener("click", async () => {
  try {
    await Notification.requestPermission();
  } finally {
    updateNotificationSettings();
  }
});

if (returnFloor) {
  for (const link of document.querySelectorAll('a[href="seat-map.html"]')) {
    link.href = "seat-map.html?floor=" + returnFloor;
  }
}
if (requestedSeat && !fromMap) {
  setText("deskBadge", t("deskNumber", { seat: requestedSeat }));
  $("deskBadge").hidden = false;
}
renderHome();
if (requestedSeat || params.get("view") === "checkin") goCheckin(false);
window.addEventListener("seatlanguagechange", () => {
  renderHome();
  if (requestedSeat && !fromMap) setText("deskBadge", t("deskNumber", { seat: requestedSeat }));
  if (currentView === "checkinView") renderCheckinText();
  if (currentView === "awayView") {
    const durations = [...$("durationRow").querySelectorAll("input")];
    for (const input of durations) input.nextElementSibling.textContent = t("minutes", { minutes: input.value });
    setText("mealNote", t(durations.length > 3 ? "mealBreak" : "standardBreak"));
  }
  if (currentView === "checkoutView") renderCheckoutText();
  if (currentView === "doneBox") renderDone();
});
setInterval(tick, 1000);
window.addEventListener("pageshow", tick);
window.addEventListener("storage", event => {
  if (event.key === KEY || event.key === null) tick();
});
