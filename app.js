"use strict";

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
      await registration.showNotification(title, { body, icon: "icon-192.png" });
    } else {
      new Notification(title, { body });
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
  void notify("座位已自动释放 · Seat released", `座位 ${released.seat} 暂离超时，已自动签出。`);
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
  if (!record) return ["idle", "还未签到", "到达座位后，扫桌贴码或输入座位号。"];
  if (record.autoOut) {
    return ["released", `${record.seat} 已释放`, `${displayTime(record.autoOut)} 自动签出。需要继续使用时请重新签到。`];
  }
  if (record.tempUntil) {
    const left = Math.max(1, Math.ceil((record.tempUntil - Date.now()) / MINUTE));
    const warning = left <= WARN_BEFORE;
    return [
      warning ? "warning" : "away",
      `${record.seat} ${warning ? "即将释放" : "暂离中"}`,
      `请于 ${displayTime(record.tempUntil)} 前返回并确认。`,
      `${left} 分钟`,
    ];
  }
  return ["occupied", `${record.seat} 在座中`, `签到时间 ${displayTime(record.checkinAt)}`];
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

function showDone(english, title, message, notifications = false) {
  notificationSetup = notifications;
  setText("doneEnglish", english);
  setText("doneTitle", title);
  setText("doneMsg", message);
  updateNotificationSettings();
  show("doneBox");
}

function updateNotificationSettings() {
  $("notifyOptions").hidden = !notificationSetup;
  const available = window.isSecureContext && "Notification" in window;
  const permission = available ? Notification.permission : "unavailable";
  $("btnEnableNotify").hidden = permission !== "default";
  const hints = {
    default: "可以授权浏览器通知。暂离快到期时，也可在当前页面查看预警。",
    granted: "浏览器通知已允许。保持页面打开以接收暂离提醒。",
    denied: "浏览器通知未获授权。页面内的预警仍可使用。",
    unavailable: "此环境可查看页面内预警。浏览器通知需要受支持的 HTTPS 或 localhost 环境。",
  };
  setText("notifyHint", hints[permission]);
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
  setText("checkinIntro", fromMap ? "这是座位图的演示签到，可用虚构资料试用。" : "坐到对应位置后，再确认签到。");
  setText("seatHint", requestedSeat
    ? (fromMap ? "已从座位图带入座位号。" : "已从签到链接带入并锁定座位号。")
    : "可以手动输入桌上的座位号，或扫描桌贴二维码。");
  setText("emailHint", endpoint && !demoCode.test(requestedSeat)
    ? "由配置的服务处理邮件提醒。"
    : "演示时可留空。");
  if (record?.autoOut) {
    for (const id of ["name", "sid", "email"]) $(id).value = record[id] ?? "";
  }
  $("formError").hidden = true;
  show("checkinView", focus);
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
  let error = "";
  if (existing && !existing.autoOut) error = `已有在座记录 ${existing.seat}，请先管理当前座位。`;
  else if (!record.name || !record.sid || !record.seat) error = "请填写姓名、学号及座位号。";
  if (error) {
    setText("formError", error);
    $("formError").hidden = false;
    return;
  }
  writeRecord(record);
  publish("checkin", record, { email: record.email });
  $("checkinForm").reset();
  showDone("CHECKED IN", "签到成功", `座位 ${record.seat} 已登记为在座中。`, true);
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
    option.append(input, `${minute} 分钟`);
    return option;
  });
  $("durationRow").replaceChildren(...choices);
  setText("mealNote", meal ? "当前为用餐时段，最多可暂离 60 分钟。" : "当前为一般时段，最多可暂离 30 分钟。");
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
  showDone("TEMPORARILY AWAY", "已登记暂离", `座位 ${record.seat} 保留至 ${displayTime(record.tempUntil)}。返回后请确认恢复在座。`);
}

function resume() {
  const record = currentRecord();
  if (!record || record.autoOut || !record.tempUntil) return goHome();
  record.tempUntil = null;
  writeRecord(record);
  publish("resume", record);
  showDone("BACK ON SEAT", "已恢复在座", `座位 ${record.seat} 已重新显示为在座中。`);
}

function goCheckout() {
  const record = currentRecord();
  if (!record || record.autoOut) return goHome();
  actionSession = record;
  setText("checkoutInfo", `当前座位 ${record.seat} · ${displayTime(record.checkinAt)} 签到`);
  show("checkoutView");
}

function checkout() {
  const record = recordForAction();
  if (!record) return;
  localStorage.removeItem(KEY);
  publish("checkout", record);
  showDone("CHECKED OUT", "已签出", `座位 ${record.seat} 已恢复可用。`);
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
    void notify("座位即将释放 · Seat releasing soon", `座位 ${record.seat} 剩余约 ${minutes} 分钟。`);
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
  setText("deskBadge", `桌号 ${requestedSeat}`);
  $("deskBadge").hidden = false;
}
renderHome();
if (requestedSeat || params.get("view") === "checkin") goCheckin(false);
setInterval(tick, 1000);
window.addEventListener("pageshow", tick);
window.addEventListener("storage", event => {
  if (event.key === KEY || event.key === null) tick();
});
