"use strict";

(() => {
  const { t } = window.SeatLanguage;
  const form = document.querySelector("#plate-form");
  const address = document.querySelector("#plate-url");
  const codeInput = document.querySelector("#plate-codes");
  const printButton = document.querySelector("#plate-print");
  const error = document.querySelector("#plate-error");
  const status = document.querySelector("#plate-status");
  const plates = document.querySelector("#plates");
  let generation = 0;

  let errorKey = null;
  let statusMessage = null;
  const webPage = /^https?:$/.test(location.protocol);
  const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (webPage) address.value = new URL("index.html", location.href).href;

  function renderPlateText() {
    const note = !webPage ? "localFile" : localPreview ? "localPreview" : "plateUrlNote";
    document.querySelector("#plate-url-note").textContent = t(note);
    if (errorKey) error.textContent = t(errorKey);
    if (statusMessage) status.textContent = t(...statusMessage);
    for (const plate of plates.children) {
      plate.querySelector("img").alt = t("plateAlt", { seat: plate.dataset.seat });
      plate.querySelector("p").textContent = t("plateCaption");
    }
  }

  function setStatus(key, values) {
    statusMessage = [key, values];
    status.textContent = t(key, values);
  }

  renderPlateText();
  window.addEventListener("seatlanguagechange", renderPlateText);

  function makePlate(base, code) {
    const target = new URL(base);
    target.searchParams.set("seat", code);
    const qr = new URL("https://api.qrserver.com/v1/create-qr-code/");
    qr.search = new URLSearchParams({ size: "300x300", margin: "16", data: target.href });

    const plate = document.createElement("article");
    plate.className = "seat-plate";
    plate.dataset.seat = code;
    const image = document.createElement("img");
    image.width = 300;
    image.height = 300;
    image.alt = t("plateAlt", { seat: code });
    image.referrerPolicy = "no-referrer";
    const heading = document.createElement("h2");
    heading.textContent = code;
    const caption = document.createElement("p");
    caption.textContent = t("plateCaption");
    plate.append(image, heading, caption);
    const loaded = new Promise((resolve) => {
      image.addEventListener("load", () => resolve(true), { once: true });
      image.addEventListener("error", () => resolve(false), { once: true });
    });
    image.src = qr.href;
    return { plate, loaded };
  }

  function invalid(key, field) {
    errorKey = key;
    error.textContent = t(key);
    error.hidden = false;
    field.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorKey = null;
    error.hidden = true;
    let base;
    try { base = new URL(address.value.trim()); } catch {}
    if (!base || !/^https?:$/.test(base.protocol) || base.username || base.password || base.search || base.hash) {
      invalid("invalidPlateUrl", address);
      return;
    }
    const codes = [...new Set(codeInput.value.split(/[,，\n]/).map((code) => code.trim().toUpperCase()).filter(Boolean))];
    if (!codes.length || codes.length > 60 || codes.some((code) => !/^[A-Z0-9][A-Z0-9_-]{0,23}$/.test(code))) {
      invalid("invalidPlateCodes", codeInput);
      return;
    }
    const current = ++generation;
    printButton.disabled = true;
    setStatus("platesWorking", { count: codes.length });
    const cards = codes.map((code) => makePlate(base, code));
    plates.replaceChildren(...cards.map(({ plate }) => plate));
    plates.hidden = false;
    const successes = (await Promise.all(cards.map(({ loaded }) => loaded))).filter(Boolean).length;
    if (current !== generation) return;
    setStatus(successes === codes.length ? "platesDone" : "platesPartial", { count: successes, total: codes.length });
    printButton.disabled = successes !== codes.length;
  });

  printButton.addEventListener("click", () => window.print());
})();
