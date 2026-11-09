"use strict";

(() => {
  const form = document.querySelector("#plate-form");
  const address = document.querySelector("#plate-url");
  const codeInput = document.querySelector("#plate-codes");
  const printButton = document.querySelector("#plate-print");
  const error = document.querySelector("#plate-error");
  const status = document.querySelector("#plate-status");
  const plates = document.querySelector("#plates");
  let generation = 0;

  if (/^https?:$/.test(location.protocol)) {
    address.value = new URL("index.html", location.href).href;
    if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
      document.querySelector("#plate-url-note").textContent =
        "当前是本机预览。打印供其他手机扫码前，请换成它们能访问的签到页面网址。";
    }
  } else {
    document.querySelector("#plate-url-note").textContent =
      "当前是本地文件。请粘贴已托管的签到页面网址（http:// 或 https://）。";
  }

  function makePlate(base, code) {
    const target = new URL(base);
    target.searchParams.set("seat", code);
    const qr = new URL("https://api.qrserver.com/v1/create-qr-code/");
    qr.search = new URLSearchParams({ size: "300x300", margin: "16", data: target.href });

    const plate = document.createElement("article");
    plate.className = "seat-plate";
    const image = document.createElement("img");
    image.width = 300;
    image.height = 300;
    image.alt = code + " 签到二维码";
    image.referrerPolicy = "no-referrer";
    const heading = document.createElement("h2");
    heading.textContent = code;
    const caption = document.createElement("p");
    caption.textContent = "到座后扫码签到";
    const english = document.createElement("small");
    english.lang = "en";
    english.textContent = "Scan to check in at your desk";
    caption.append(english);
    plate.append(image, heading, caption);
    const loaded = new Promise((resolve) => {
      image.addEventListener("load", () => resolve(true), { once: true });
      image.addEventListener("error", () => resolve(false), { once: true });
    });
    image.src = qr.href;
    return { plate, loaded };
  }

  function invalid(message, field) {
    error.textContent = message;
    error.hidden = false;
    field.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    let base;
    try { base = new URL(address.value.trim()); } catch {}
    if (!base || !/^https?:$/.test(base.protocol) || base.username || base.password || base.search || base.hash) {
      invalid("请输入不含登录信息、查询参数或片段的 HTTP(S) 签到页面网址。", address);
      return;
    }
    const codes = [...new Set(codeInput.value.split(/[,，\n]/).map((code) => code.trim().toUpperCase()).filter(Boolean))];
    if (!codes.length || codes.length > 60 || codes.some((code) => !/^[A-Z0-9][A-Z0-9_-]{0,23}$/.test(code))) {
      invalid("请输入 1 至 60 个座位号。每个座位号最长 24 个字符，可用英文字母、数字、连字符或下划线。", codeInput);
      return;
    }
    const current = ++generation;
    printButton.disabled = true;
    status.textContent = "正在生成 " + codes.length + " 张号码牌…";
    const cards = codes.map((code) => makePlate(base, code));
    plates.replaceChildren(...cards.map(({ plate }) => plate));
    plates.hidden = false;
    const successes = (await Promise.all(cards.map(({ loaded }) => loaded))).filter(Boolean).length;
    if (current !== generation) return;
    status.textContent = successes === codes.length
      ? "已生成 " + successes + " 张号码牌。"
      : "已生成 " + successes + " / " + codes.length + " 张二维码。请检查网络后重新生成。";
    printButton.disabled = successes !== codes.length;
  });

  printButton.addEventListener("click", () => window.print());
})();
