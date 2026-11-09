"use strict";

(() => {
  // Entries contain Traditional Chinese and English, in that order.
  const messages = {
    brand: ["自習室座位", "Study Seat"],
    home: ["首頁", "Home"],
    seatMap: ["座位圖", "Seat map"],
    navigation: ["主選單", "Main navigation"],
    footer: ["CDT504 · 圖書館座位周轉系統", "CDT504 · Campus Library Seat Rotation"],
    homeDescription: ["查看自習室空位，到座後掃碼簽到。", "Find an available seat and scan the desk code to check in."],
    studyRoom: ["圖書館自習", "Library study space"],
    demo: ["演示模式", "Demo mode"],
    heroFirst: ["先查空位，", "Find an open seat."],
    heroSecond: ["到座再簽到。", "Check in at the desk."],
    heroBody: ["在手機上查看座位狀態。找到空位後，掃描桌上的二維碼，確認座位編號。", "Check availability on your phone. Once you reach an open seat, scan the desk QR code to confirm your seat number."],
    openMap: ["查看空位圖", "Find a seat"],
    mapPreviewLabel: ["開啟圖書館四個樓層的座位圖", "Open the seat map for four library floors"],
    fourFloors: ["4 個樓層", "4 floors"],
    session: ["使用狀態", "Session"],
    mySeat: ["我的座位", "My seat"],
    checkIn: ["簽到入座", "Check in"],
    stepAway: ["暫時離開", "Step away"],
    imBack: ["我已返回", "I’m back"],
    checkOut: ["結束使用", "Check out"],
    sessionRules: ["查看暫離規則", "Session rules"],
    rulesBody: ["一般時段最多 30 分鐘。午餐時段 11:00–13:30、晚餐時段 17:00–19:30 最多 60 分鐘。到期前 10 分鐘，簽到頁面會顯示提醒。到期仍未確認返回，座位會自動釋出。", "Breaks are capped at 30 minutes during standard hours and 60 minutes during meal hours (11:00–13:30 and 17:00–19:30). The check-in page warns you 10 minutes before expiry. The seat is released automatically if you do not confirm your return in time."],
    backHome: ["← 返回首頁", "← Back to home"],
    checkinEyebrow: ["座位登記", "Seat registration"],
    deskIntro: ["到達座位後，再確認簽到。", "Confirm check-in once you reach the desk."],
    seatNumber: ["座位編號", "Seat number"],
    name: ["姓名", "Name"],
    studentId: ["學生編號", "Student ID"],
    seatExample: ["例如 A03", "e.g. A03"],
    namePlaceholder: ["輸入姓名", "Enter your name"],
    idPlaceholder: ["輸入學生編號", "Enter your student ID"],
    email: ["提醒電郵（選填）", "Reminder email (optional)"],
    demoEmail: ["演示時可留空。", "Leave blank for the demo."],
    confirmIn: ["確認簽到", "Confirm check-in"],
    backMap: ["返回座位圖", "Back to seat map"],
    breakEyebrow: ["座位保留", "Seat hold"],
    breakIntro: ["選擇預計離開多久，回來後點選「我已返回」。", "Choose a break length. Select “I’m back” when you return."],
    duration: ["選擇時長", "Break duration"],
    breakNotice: ["到期前 10 分鐘，頁面會顯示提醒。超時仍未返回，座位會自動釋出。", "The page shows a reminder 10 minutes before expiry. If you do not return in time, the seat is released."],
    confirmAway: ["確認暫離", "Confirm break"],
    checkoutEyebrow: ["座位釋出", "Seat release"],
    checkoutIntro: ["確認簽出後，座位圖會將該座位標為空位。", "Confirm checkout to mark your seat available on the map."],
    confirmOut: ["確認簽出", "Confirm checkout"],
    enableNotify: ["開啟瀏覽器通知", "Enable browser notifications"],
    manageSeat: ["管理我的座位", "Manage my seat"],
    viewMap: ["查看座位圖", "View seat map"],
    footerFlow: ["查空位 · 簽到 · 釋出", "Find a seat · Check in · Release"],
    mapTitle: ["分層座位圖", "Seat Map"],
    mapDescription: ["按樓層查看嶺南大學圖書館的演示座位狀態。", "Explore demo seat availability by floor at Lingnan University Library."],
    library: ["嶺南大學圖書館", "LINGNAN UNIVERSITY LIBRARY"],
    findSeat: ["尋找空位", "Find an available seat"],
    mapIntro: ["選擇樓層查看空位，到桌後再簽到。", "Choose a floor, find a seat and check in at the desk."],
    mapDemoNote: ["底圖取自圖書館平面圖。彩色標點的座位編號及狀態為演示資料。", "The floor plans are from the library. Coloured seat markers and statuses are simulated."],
    chooseFloor: ["選擇樓層", "Choose a floor"],
    floorStatuses: ["本層座位演示狀態", "Demo seat statuses on this floor"],
    empty: ["空位", "Available"],
    occ: ["在座", "In use"],
    away: ["暫離", "Away"],
    floorPlan: ["樓層平面圖", "Floor plan"],
    chooseZoneDetail: ["選擇區域查看座位詳情", "Choose an area to see individual seats"],
    refreshTitle: ["重新整理本機簽到狀態", "Refresh seat status on this device"],
    refresh: ["重新整理", "Refresh"],
    zoomZone: ["放大區域", "Zoom into an area"],
    legend: ["圖例", "Legend"],
    planSource: ["平面圖來源 · 嶺南大學圖書館", "Floor plans · Lingnan University Library"],
    floorSeats: ["本層演示座位", "Seats on this floor"],
    seatDetails: ["點選地圖上的標點或下方座位以查看詳情。", "Tap a map marker or seat below for details."],
    libraryFooter: ["嶺南大學圖書館", "Fong Sum Wood Library"],
    seat: ["座位", "Seat"],
    seatStatus: ["座位狀態", "Seat status"],
    close: ["關閉", "Close"],
    goCheckin: ["前往簽到", "Go to check-in"],
    plates: ["座位牌", "Desk QR plates"],
    roomSetup: ["自習室設置", "Room setup"],
    generatePlates: ["製作座位牌", "Create desk QR plates"],
    plateIntro: ["批量製作桌貼二維碼。到座後掃碼，簽到表便會自動填上座位編號。", "Create desk QR codes in batches. Scanning a code fills in the seat number on the check-in form."],
    checkinUrl: ["簽到頁面網址", "Check-in page URL"],
    plateUrlNote: ["列印前，請確認手機可以開啟此網址。", "Check that the URL opens on a phone before printing."],
    seatNumbers: ["座位編號", "Seat numbers"],
    codesNote: ["以逗號或換行分隔，每批最多 60 個座位。", "Separate seat numbers with commas or new lines. Enter up to 60 per batch."],
    plateProvider: ["製作座位牌時，簽到網址和座位編號會傳送至外部二維碼服務 QR Server。此處無需輸入姓名、學生編號或電郵。", "Generating plates sends the check-in URL and seat numbers to QR Server. Names, student IDs and email addresses are unnecessary."],
    generate: ["製作座位牌", "Generate plates"],
    print: ["列印", "Print"],
    switchLanguage: ["切換至英文", "Switch to Traditional Chinese"],
    notCheckedIn: ["尚未簽到", "Not checked in"],
    checkinPrompt: ["到達座位後，掃描桌貼二維碼或輸入座位編號。", "At the desk, scan its QR code or enter the seat number."],
    releasedStatus: ["{seat} 已釋出", "{seat} released"],
    releasedDetail: ["{time} 自動簽出。如需繼續使用，請重新簽到。", "Automatically checked out at {time}. Check in again to keep studying."],
    warningStatus: ["{seat} 即將釋出", "{seat} releasing soon"],
    awayStatus: ["{seat} 暫離中", "{seat} on a break"],
    returnBy: ["請於 {time} 前返回並確認。", "Return and confirm by {time}."],
    minutes: ["{minutes} 分鐘", "{minutes} min"],
    occupiedStatus: ["{seat} 在座中", "{seat} in use"],
    checkedInAt: ["簽到時間 {time}", "Checked in at {time}"],
    releaseNotification: ["座位已自動釋出", "Seat released"],
    releaseNotificationDetail: ["座位 {seat} 暫離超時，已自動簽出。", "Your break at {seat} expired and you were checked out."],
    warningNotification: ["座位即將釋出", "Seat releasing soon"],
    warningNotificationDetail: ["座位 {seat} 剩餘約 {minutes} 分鐘。", "About {minutes} min left at {seat}."],
    notifyDefault: ["可授權瀏覽器通知。暫離快到期時，此頁亦會顯示提醒。", "Allow browser notifications if you like. This page also warns you when your break is nearly over."],
    notifyGranted: ["瀏覽器通知已啟用。請保持頁面開啟以接收提醒。", "Browser notifications are enabled. Keep this page open for break reminders."],
    notifyDenied: ["瀏覽器通知未獲授權，仍可在此頁查看提醒。", "Browser notifications are blocked. Reminders still appear on this page."],
    notifyUnavailable: ["此頁可顯示提醒。瀏覽器通知需在支援的 HTTPS 或 localhost 環境使用。", "Reminders appear on this page. Browser notifications require supported HTTPS or localhost access."],
    demoCheckinIntro: ["這是座位圖的演示簽到，可用虛構資料試用。", "Try the seat map demo with fictional details."],
    seatFromMap: ["已從座位圖帶入座位編號。", "Seat number filled in from the map."],
    seatFromCode: ["已從簽到連結帶入並鎖定座位編號。", "Seat number filled in and locked from the check-in link."],
    seatManual: ["可輸入桌上的座位編號，或掃描桌貼二維碼。", "Enter the desk number or scan its QR code."],
    emailService: ["已設定的服務會處理電郵提醒。", "The configured service handles email reminders."],
    existingCheckin: ["已有在座記錄 {seat}，請先管理目前的座位。", "You already have an active seat ({seat}). Manage that seat first."],
    requiredDetails: ["請填寫姓名、學生編號及座位編號。", "Enter your name, student ID and seat number."],
    invalidEmail: ["請輸入有效的電郵地址。", "Enter a valid email address."],
    checkinDone: ["簽到成功", "Checked in"],
    checkinDoneDetail: ["座位 {seat} 已標為在座。", "Seat {seat} is now marked as in use."],
    mealBreak: ["目前為用餐時段，最多可暫離 60 分鐘。", "Meal hours are in effect. You can step away for up to 60 minutes."],
    standardBreak: ["目前為一般時段，最多可暫離 30 分鐘。", "During standard hours, you can step away for up to 30 minutes."],
    awayDone: ["已登記暫離", "Break started"],
    awayDoneDetail: ["座位 {seat} 保留至 {time}。回來後請確認返回。", "Seat {seat} is held until {time}. Confirm your return when you get back."],
    resumeEyebrow: ["暫離已結束", "Break ended"],
    resumeDone: ["已恢復在座", "Back at your seat"],
    resumeDoneDetail: ["座位 {seat} 已重新標為在座。", "Seat {seat} is marked as in use again."],
    checkoutDetail: ["目前座位 {seat} · {time} 簽到", "Seat {seat} · Checked in at {time}"],
    checkoutDone: ["已簽出", "Checked out"],
    checkoutDoneDetail: ["座位 {seat} 已恢復為空位。", "Seat {seat} is available again."],
    deskNumber: ["桌號 {seat}", "Desk {seat}"],
    firstFloor: ["一樓", "First floor"],
    mezzanine: ["夾層", "Mezzanine"],
    secondFloor: ["二樓", "Second floor"],
    thirdFloor: ["三樓", "Third floor"],
    centralLongTables: ["中央長桌", "Central long tables"],
    leftSeats: ["左側桌位", "Left-side desks"],
    rightSeats: ["右側桌位", "Right-side desks"],
    farRightSeats: ["右端桌位", "Far-right desks"],
    leftLongTables: ["左側長桌", "Left-side long tables"],
    centralSeats: ["中央桌位", "Central desks"],
    upperRightSeats: ["右上桌位", "Upper-right desks"],
    lowerRightSeats: ["右下桌位", "Lower-right desks"],
    upperLeftRoundTables: ["左上圓桌", "Upper-left round tables"],
    leftCorridorSeats: ["左側走廊桌位", "Left corridor desks"],
    rightCorridorSeats: ["右側走廊桌位", "Right corridor desks"],
    wholeFloor: ["整層", "Whole floor"],
    floorAlt: ["嶺南大學圖書館 {floor} 平面圖", "Lingnan University Library {floor} floor plan"],
    zoneCount: ["{zone} · {count} 個演示座位", "{zone} · {count} demo seats"],
    floorCount: ["{count} 個演示座位 · 可放大指定區域", "{count} demo seats · Select an area to zoom"],
    mapRefreshed: ["{floor} 本機座位狀態已更新", "{floor} seat statuses refreshed on this device"],
    emptyDescription: ["到桌後，可用此編號演示簽到。", "Use this number to try check-in when you reach the desk."],
    ownOccupiedDescription: ["這是你在本機簽到的座位。", "You checked into this seat on this device."],
    demoOccupiedDescription: ["模擬場景中，此座位正在使用。", "This demo seat is currently in use."],
    ownAwayDescription: ["你的座位目前處於暫離狀態。", "Your seat is held while you are away."],
    demoAwayDescription: ["模擬場景中，使用者暫時離開。", "The demo occupant is on a break."],
    heldFor: ["預計保留約 {minutes} 分鐘。", "Held for about {minutes} min."],
    remaining: ["約 {minutes} 分鐘", "About {minutes} min left"],
    localPreview: ["目前為本機預覽。列印供其他手機掃碼前，請改用可在手機開啟的簽到網址。", "This is a local preview. Use a check-in URL other phones can reach before printing."],
    localFile: ["目前以本地檔案開啟。請貼上已託管的 HTTP 或 HTTPS 簽到網址。", "This is a local file. Paste the hosted HTTP or HTTPS check-in URL."],
    plateAlt: ["{seat} 簽到二維碼", "Check-in QR code for {seat}"],
    plateCaption: ["到座後掃碼簽到", "Scan to check in at your desk"],
    invalidPlateUrl: ["請輸入不含登入資料、查詢參數或片段的 HTTP 或 HTTPS 簽到網址。", "Enter an HTTP or HTTPS check-in URL without credentials, a query or a fragment."],
    invalidPlateCodes: ["請輸入 1 至 60 個座位編號。每個編號最多 24 個字元，可使用英文字母、數字、連字號或底線。", "Enter 1 to 60 seat numbers, up to 24 characters each. Use letters, numbers, hyphens or underscores."],
    platesWorking: ["正在製作 {count} 張座位牌…", "Generating {count} desk plates…"],
    platesDone: ["已製作 {count} 張座位牌。", "Generated {count} desk plates."],
    platesPartial: ["已製作 {count} / {total} 張座位牌。請檢查網絡後重試。", "Generated {count} of {total} desk plates. Check your connection and try again."]
  };

  const storageKey = "studySeatLanguage";
  const supported = value => Object.hasOwn({ "zh-HK": true, en: true }, value);

  function preference() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function requestedLanguage() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (supported(requested)) return requested;
    const saved = preference();
    return supported(saved) ? saved : "zh-HK";
  }

  let language = requestedLanguage();

  function t(key, values = {}) {
    return messages[key][language === "en" ? 1 : 0]
      .replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    for (const attribute of ["text", "aria-label", "placeholder", "title", "content"]) {
      for (const node of document.querySelectorAll("[data-" + attribute + "]")) {
        const translated = t(node.getAttribute("data-" + attribute));
        if (attribute === "text") node.textContent = translated;
        else node.setAttribute(attribute, translated);
      }
    }
    for (const button of document.querySelectorAll("[data-language]")) {
      button.textContent = language === "en" ? "繁體中文" : "English";
      button.lang = language === "en" ? "zh-HK" : "en";
      button.setAttribute("aria-label", t("switchLanguage"));
    }
  }

  function updateLanguage(next) {
    if (language === next) return;
    language = next;
    applyLanguage();
    window.dispatchEvent(new Event("seatlanguagechange"));
  }

  function toggle() {
    const next = language === "en" ? "zh-HK" : "en";
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The current page still supports switching if storage is disabled.
    }
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", next);
      history.replaceState(null, "", url);
    }
    updateLanguage(next);
  }

  window.SeatLanguage = { t };
  applyLanguage();
  for (const button of document.querySelectorAll("[data-language]")) button.addEventListener("click", toggle);
  window.addEventListener("pageshow", () => updateLanguage(requestedLanguage()));
  window.addEventListener("storage", event => {
    if (event.key === storageKey) updateLanguage(requestedLanguage());
  });
})();
