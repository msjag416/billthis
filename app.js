/* BillThis — private receipt maker.
   Everything lives in the browser (localStorage). See ARCHITECTURE.md. */

(() => {
  const STORE_KEY = "billthis:v1";
  const ACCENTS = ["#1f6f5c", "#2f5bd3", "#7a3ff0", "#c2410c", "#be185d", "#0e7490", "#18181b"];
  const CURRENCY = {
    CAD: { symbol: "$", locale: "en-CA" },
    USD: { symbol: "$", locale: "en-US" },
    KYD: { symbol: "CI$", locale: "en-KY" },
    EUR: { symbol: "€", locale: "en-IE" },
    GBP: { symbol: "£", locale: "en-GB" },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- Data ---------------- */

  function newProfile(name = "My Business") {
    return {
      id: uid(),
      business: { name, address: "", phone: "", email: "", website: "", taxId: "", logo: "", numberPrefix: "R-" },
      nextNumber: 1,
      defaults: {
        currency: "CAD",
        taxes: [{ name: "HST", rate: 13 }],
        template: "modern", font: "sans", accent: ACCENTS[0],
        logoPos: "left", footerAlign: "center",
        paymentMethod: "Interac e-Transfer",
        footer: "Thank you for your business!",
      },
    };
  }

  function receiptNumber(p) {
    return (p.business.numberPrefix || "") + String(p.nextNumber).padStart(4, "0");
  }

  function newReceipt(p) {
    const d = p.defaults;
    return {
      id: null, // set once saved
      profileId: p.id,
      title: "Receipt",
      number: receiptNumber(p),
      date: today(), time: "",
      currency: d.currency,
      customer: { name: "", address: "", email: "", phone: "" },
      items: [{ desc: "", qty: 1, price: "", taxable: true }],
      taxes: clone(d.taxes),
      discountValue: "", discountType: "amount",
      shipping: "", tip: "", taxIncluded: false,
      paymentMethod: d.paymentMethod, paymentRef: "", amountPaid: "", showPaidStamp: false,
      notes: "", footer: d.footer,
      template: d.template, font: d.font, accent: d.accent,
      logoPos: d.logoPos, footerAlign: d.footerAlign,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.profiles) && s.profiles.length) return s;
      }
    } catch (e) { /* storage blocked or corrupt — start fresh */ }
    const p = newProfile();
    return { profiles: [p], activeProfileId: p.id, history: [] };
  }

  let state = load();
  let current = null;

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
    catch (e) { toast("Couldn't save in this browser (storage full or blocked)"); return false; }
  }

  const profile = () => state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0];

  /* ---------------- Money ---------------- */

  function money(v, code = current.currency) {
    const c = CURRENCY[code] || CURRENCY.CAD;
    const n = Math.round(v * 100) / 100;
    const body = Math.abs(n).toLocaleString(c.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n < 0 ? "-" : "") + c.symbol + body;
  }

  function totals(r) {
    const lines = r.items.map((i) => ({ ...i, amount: num(i.qty) * num(i.price) }));
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const taxableSub = lines.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0);
    let discount = r.discountType === "percent" ? subtotal * num(r.discountValue) / 100 : num(r.discountValue);
    discount = Math.min(Math.max(discount, 0), subtotal);
    const share = subtotal ? 1 - discount / subtotal : 1;
    const taxBase = taxableSub * share;
    const totalRate = r.taxes.reduce((s, t) => s + num(t.rate), 0) / 100;

    const taxLines = r.taxes.filter((t) => t.name || num(t.rate)).map((t) => {
      const rate = num(t.rate) / 100;
      const amt = r.taxIncluded
        ? (totalRate ? (taxBase - taxBase / (1 + totalRate)) * (rate / totalRate) : 0)
        : taxBase * rate;
      return { name: t.name || "Tax", rate: num(t.rate), amount: amt };
    });
    const taxTotal = taxLines.reduce((s, t) => s + t.amount, 0);
    const shipping = num(r.shipping), tip = num(r.tip);
    const total = subtotal - discount + (r.taxIncluded ? 0 : taxTotal) + shipping + tip;
    const paidGiven = r.amountPaid !== "" && r.amountPaid != null;
    const paid = paidGiven ? num(r.amountPaid) : total;
    return { lines, subtotal, discount, taxLines, shipping, tip, total, paidGiven, paid, balance: total - paid };
  }

  /* ---------------- Render receipt ---------------- */

  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  }
  function fmtTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const d = new Date(); d.setHours(h, m);
    return d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  }

  function renderReceipt() {
    const r = current, b = profile().business, t = totals(r);
    const el = $("#receipt");
    el.className = `receipt t-${r.template} f-${r.font}`;
    el.style.setProperty("--r-accent", r.accent);

    const bizLines = [b.address, [b.phone, b.email].filter(Boolean).join("  ·  "), b.website, b.taxId ? `Tax/HST #: ${b.taxId}` : ""]
      .filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join("");
    const c = r.customer;
    const hasCust = c.name || c.address || c.email || c.phone;

    const rows = t.lines.filter((l) => l.desc || num(l.price)).map((l) => `
      <tr>
        <td class="desc">${esc(l.desc) || "&nbsp;"}</td>
        <td class="num col-qty">${esc(l.qty)}</td>
        <td class="num col-qty">${money(num(l.price))}</td>
        <td class="num">${money(l.amount)}</td>
      </tr>`).join("") || `<tr><td colspan="4" style="color:#9a9aa1">Add an item to get started</td></tr>`;

    const totalRows = [
      `<div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>`,
      t.discount ? `<div><span>Discount${r.discountType === "percent" ? ` (${num(r.discountValue)}%)` : ""}</span><span>-${money(t.discount)}</span></div>` : "",
      ...t.taxLines.map((x) => `<div><span>${esc(x.name)} ${x.rate}%${r.taxIncluded ? " (incl.)" : ""}</span><span>${money(x.amount)}</span></div>`),
      t.shipping ? `<div><span>Shipping</span><span>${money(t.shipping)}</span></div>` : "",
      t.tip ? `<div><span>Tip</span><span>${money(t.tip)}</span></div>` : "",
      `<div class="grand"><span>Total ${esc(r.currency)}</span><span>${money(t.total)}</span></div>`,
      t.paidGiven ? `<div class="paid-line"><span>Amount paid</span><span>${money(t.paid)}</span></div>` : "",
      t.paidGiven && Math.abs(t.balance) > 0.004 ? `<div class="due"><span>Balance due</span><span>${money(t.balance)}</span></div>` : "",
    ].join("");

    const pay = [r.paymentMethod ? `Paid by ${esc(r.paymentMethod)}` : "", r.paymentRef ? `Ref: ${esc(r.paymentRef)}` : ""].filter(Boolean).join("  ·  ");
    const logoPos = r.template === "thermal" ? "center" : r.logoPos;

    el.innerHTML = `
      <header class="r-head logo-${logoPos}">
        <div class="r-biz">
          ${b.logo ? `<img class="r-logo" src="${b.logo}" alt="">` : ""}
          <p class="r-biz-name">${esc(b.name)}</p>
          ${bizLines}
        </div>
        <div class="r-title-block">
          <h1 class="r-title">${esc(r.title || "Receipt")}</h1>
          <dl class="r-meta">
            ${r.number ? `<dt>No.</dt><dd>${esc(r.number)}</dd>` : ""}
            ${r.date ? `<dt>Date</dt><dd>${fmtDate(r.date)}${r.time ? " " + fmtTime(r.time) : ""}</dd>` : ""}
          </dl>
        </div>
      </header>
      ${hasCust ? `
      <section class="r-parties">
        <div class="r-cust">
          <div class="r-label">Billed to</div>
          ${c.name ? `<strong>${esc(c.name)}</strong>` : ""}
          ${[c.address, c.email, c.phone].filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join("")}
        </div>
      </section>` : `<div style="height:28px"></div>`}
      <table class="r-items">
        <thead><tr>
          <th>Description</th><th class="num col-qty">Qty</th><th class="num col-qty">Price</th><th class="num">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <section class="r-summary">
        ${r.showPaidStamp && (!t.paidGiven || t.balance <= 0.004) ? `<div class="r-stamp">PAID</div>` : ""}
        <div class="r-totals">${totalRows}</div>
      </section>
      ${pay ? `<p class="r-payment">${pay}</p>` : ""}
      ${r.notes ? `<p class="r-notes">${esc(r.notes)}</p>` : ""}
      ${r.footer ? `<footer class="r-footer" style="text-align:${r.template === "thermal" ? "center" : r.footerAlign}">${esc(r.footer)}</footer>` : ""}
    `;
    fitPreview();
  }

  // Shrink the paper on small screens so it fits without sideways scrolling
  function fitPreview() {
    const el = $("#receipt"), wrap = $(".paper-wrap");
    el.style.zoom = "";
    const avail = wrap.clientWidth - 16;
    if (avail > 0 && el.offsetWidth > avail) el.style.zoom = (avail / el.offsetWidth).toFixed(3);
  }
  window.addEventListener("resize", fitPreview);

  /* ---------------- Editor ---------------- */

  function fillForm() {
    const r = current, b = profile().business;
    $$("[data-field]").forEach((el) => {
      const v = r[el.dataset.field];
      if (el.type === "checkbox") el.checked = !!v; else el.value = v ?? "";
    });
    $$("[data-biz]").forEach((el) => { el.value = b[el.dataset.biz] ?? ""; });
    $$("[data-cust]").forEach((el) => { el.value = r.customer[el.dataset.cust] ?? ""; });
    renderItems(); renderTaxes(); renderLogoThumb(); renderStylePickers(); renderProfiles();
  }

  function renderItems() {
    $("#itemsList").innerHTML = current.items.map((it, i) => `
      <div class="item-row" data-i="${i}">
        <input data-item="desc" value="${esc(it.desc)}" placeholder="Item or service">
        <input data-item="qty" type="number" min="0" step="any" value="${esc(it.qty)}">
        <input data-item="price" type="number" step="0.01" value="${esc(it.price)}" placeholder="0.00">
        <input data-item="taxable" type="checkbox" ${it.taxable ? "checked" : ""} title="Apply tax">
        <button class="icon-btn" data-remove-item="${i}" title="Remove">×</button>
      </div>`).join("");
  }

  function renderTaxes() {
    $("#taxList").innerHTML = current.taxes.map((t, i) => `
      <div class="tax-row" data-i="${i}">
        <input data-tax="name" value="${esc(t.name)}" placeholder="Tax name (e.g. HST)">
        <div class="combo"><input data-tax="rate" type="number" step="0.001" min="0" value="${esc(t.rate)}"><span style="align-self:center;color:var(--muted)">%</span></div>
        <button class="icon-btn" data-remove-tax="${i}" title="Remove">×</button>
      </div>`).join("") || `<p style="color:var(--muted);margin:0 0 4px">No tax on this receipt.</p>`;
  }

  function renderLogoThumb() {
    const logo = profile().business.logo, th = $("#logoThumb");
    th.style.backgroundImage = logo ? `url(${logo})` : "";
    th.textContent = logo ? "" : "No logo";
  }

  function renderStylePickers() {
    $$("#templatePicker button").forEach((b) => b.classList.toggle("active", b.dataset.template === current.template));
    $("#swatches").innerHTML = ACCENTS.map((c) =>
      `<button class="swatch ${c === current.accent ? "active" : ""}" data-accent="${c}" style="background:${c}" title="${c}"></button>`).join("") +
      `<input type="color" id="customAccent" value="${current.accent}" title="Custom colour" style="width:28px;height:28px;padding:0;border:none;background:none">`;
    document.documentElement.style.setProperty("--accent", current.accent);
  }

  function renderProfiles() {
    $("#profileSelect").innerHTML = state.profiles.map((p) =>
      `<option value="${p.id}" ${p.id === state.activeProfileId ? "selected" : ""}>${esc(p.business.name || "Untitled business")}</option>`).join("");
  }

  let saveTimer;
  function changed() {
    renderReceipt();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveDraft(); persist(); }, 400);
  }

  function saveDraft() { state.draft = current; }

  // Form input — one listener for everything
  $("#editor").addEventListener("input", (e) => {
    const el = e.target;
    const val = el.type === "checkbox" ? el.checked : el.value;
    if (el.dataset.field) current[el.dataset.field] = val;
    else if (el.dataset.biz) {
      profile().business[el.dataset.biz] = val;
      if (el.dataset.biz === "name") renderProfiles();
      if (el.dataset.biz === "numberPrefix" && !current.id) { current.number = receiptNumber(profile()); $('[data-field="number"]').value = current.number; }
    }
    else if (el.dataset.cust) current.customer[el.dataset.cust] = val;
    else if (el.dataset.item) current.items[+el.closest(".item-row").dataset.i][el.dataset.item] = val;
    else if (el.dataset.tax) current.taxes[+el.closest(".tax-row").dataset.i][el.dataset.tax] = val;
    else if (el.id === "customAccent") { current.accent = val; document.documentElement.style.setProperty("--accent", val); $$(".swatch").forEach((s) => s.classList.remove("active")); }
    else return;
    changed();
  });

  $("#editor").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.matches("[data-remove-item]")) { current.items.splice(+t.dataset.removeItem, 1); if (!current.items.length) current.items.push({ desc: "", qty: 1, price: "", taxable: true }); renderItems(); changed(); }
    else if (t.matches("[data-remove-tax]")) { current.taxes.splice(+t.dataset.removeTax, 1); renderTaxes(); changed(); }
    else if (t.matches("[data-template]")) { current.template = t.dataset.template; renderStylePickers(); changed(); }
    else if (t.matches("[data-accent]")) { current.accent = t.dataset.accent; renderStylePickers(); changed(); }
  });

  $("#addItemBtn").onclick = () => {
    current.items.push({ desc: "", qty: 1, price: "", taxable: true });
    renderItems(); changed();
    $$("#itemsList .item-row").at(-1).querySelector("input").focus();
  };
  $("#addTaxBtn").onclick = () => { current.taxes.push({ name: "", rate: "" }); renderTaxes(); changed(); };

  // Logo upload — shrink so it fits in browser storage
  $("#logoInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 480, scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        profile().business.logo = cv.toDataURL("image/png");
        renderLogoThumb(); changed();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  $("#removeLogoBtn").onclick = () => { profile().business.logo = ""; renderLogoThumb(); changed(); };

  /* ---------------- Businesses ---------------- */

  $("#profileSelect").onchange = (e) => {
    state.activeProfileId = e.target.value;
    current = newReceipt(profile());
    fillForm(); changed();
  };
  $("#newProfileBtn").onclick = () => {
    const name = prompt("Name of the business:");
    if (!name) return;
    const p = newProfile(name.trim());
    state.profiles.push(p);
    state.activeProfileId = p.id;
    current = newReceipt(p);
    fillForm(); changed();
    toast(`Added ${p.business.name}`);
  };
  $("#deleteProfileBtn").onclick = () => {
    if (state.profiles.length < 2) return toast("You need at least one business");
    const p = profile();
    if (!confirm(`Delete "${p.business.name}"? Its saved receipts stay in History.`)) return;
    state.profiles = state.profiles.filter((x) => x.id !== p.id);
    state.activeProfileId = state.profiles[0].id;
    current = newReceipt(profile());
    fillForm(); changed();
  };

  /* ---------------- Save / history ---------------- */

  function rememberDefaults(p, r) {
    Object.assign(p.defaults, {
      currency: r.currency, taxes: clone(r.taxes), template: r.template, font: r.font, accent: r.accent,
      logoPos: r.logoPos, footerAlign: r.footerAlign, paymentMethod: r.paymentMethod, footer: r.footer,
    });
  }

  $("#saveBtn").onclick = () => {
    const p = profile();
    const isNew = !current.id;
    if (isNew) {
      current.id = uid();
      if (current.number === receiptNumber(p)) p.nextNumber += 1;
    }
    const entry = {
      id: current.id, savedAt: new Date().toISOString(), profileId: p.id,
      bizName: p.business.name, logo: p.business.logo,
      total: totals(current).total, receipt: clone(current),
    };
    const i = state.history.findIndex((h) => h.id === entry.id);
    if (i >= 0) state.history[i] = entry; else state.history.unshift(entry);
    rememberDefaults(p, current);
    saveDraft();
    if (persist()) toast(isNew ? `Saved ${current.number}` : "Updated");
  };

  $("#newReceiptBtn").onclick = () => {
    current = newReceipt(profile());
    fillForm(); changed();
    toast("New receipt");
  };

  function openHistory() {
    renderHistory();
    $("#historyDrawer").classList.add("open");
    $("#historyDrawer").setAttribute("aria-hidden", "false");
    $("#scrim").classList.add("show");
  }
  function closeHistory() {
    $("#historyDrawer").classList.remove("open");
    $("#historyDrawer").setAttribute("aria-hidden", "true");
    $("#scrim").classList.remove("show");
  }
  $("#historyBtn").onclick = openHistory;
  $("#closeHistoryBtn").onclick = closeHistory;
  $("#scrim").onclick = closeHistory;
  $("#historySearch").oninput = renderHistory;

  function renderHistory() {
    const q = $("#historySearch").value.trim().toLowerCase();
    const list = state.history.filter((h) => !q ||
      [h.receipt.number, h.receipt.customer.name, h.bizName, h.total.toFixed(2), h.receipt.title].join(" ").toLowerCase().includes(q));
    $("#historyList").innerHTML = list.map((h) => `
      <div class="hist-item" data-id="${h.id}">
        <div><strong>${esc(h.receipt.customer.name || "No customer")}</strong>
          <div class="meta">${esc(h.receipt.number)} · ${fmtDate(h.receipt.date)} · ${esc(h.bizName)}</div></div>
        <div class="amt">${money(h.total, h.receipt.currency)}</div>
        <div class="row">
          <button class="btn ghost" data-h="open">Open</button>
          <button class="btn ghost" data-h="copy">Copy as new</button>
          <button class="btn ghost danger" data-h="del">Delete</button>
        </div>
      </div>`).join("") || `<p class="empty">${q ? "No matches." : "Saved receipts will show up here."}</p>`;
  }

  $("#historyList").onclick = (e) => {
    const btn = e.target.closest("[data-h]");
    if (!btn) return;
    const h = state.history.find((x) => x.id === btn.closest(".hist-item").dataset.id);
    if (!h) return;
    const action = btn.dataset.h;
    if (action === "del") {
      if (!confirm(`Delete receipt ${h.receipt.number}?`)) return;
      state.history = state.history.filter((x) => x.id !== h.id);
      persist(); renderHistory(); return;
    }
    // Make sure the receipt's business exists; if it was deleted, re-create it from the saved copy
    if (!state.profiles.some((p) => p.id === h.profileId)) {
      const p = newProfile(h.bizName); p.id = h.profileId; p.business.logo = h.logo || "";
      state.profiles.push(p);
    }
    state.activeProfileId = h.profileId;
    current = clone(h.receipt);
    if (action === "copy") {
      current.id = null;
      current.number = receiptNumber(profile());
      current.date = today();
      current.amountPaid = "";
    }
    fillForm(); changed(); closeHistory();
    toast(action === "copy" ? "Copied — remember to save" : `Opened ${current.number}`);
  };

  /* ---------------- Backup ---------------- */

  $("#exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `billthis-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("#importInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((txt) => {
      const s = JSON.parse(txt);
      if (!s || !Array.isArray(s.profiles) || !s.profiles.length) throw new Error("bad file");
      if (!confirm("Replace everything in this browser with the backup?")) return;
      state = { history: [], ...s };
      current = state.draft && state.profiles.some((p) => p.id === state.draft.profileId) ? state.draft : newReceipt(profile());
      state.activeProfileId = current.profileId;
      fillForm(); changed();
      toast("Backup restored");
    }).catch(() => toast("That file isn't a BillThis backup"));
    e.target.value = "";
  };

  /* ---------------- Export ---------------- */

  function fileName(ext) {
    const parts = [current.number || "receipt", current.customer.name].filter(Boolean).join("-");
    return parts.replace(/[^\w\-]+/g, "_").slice(0, 60) + "." + ext;
  }

  function exportOptions() {
    const el = $("#receipt");
    const thermal = current.template === "thermal";
    const pxToMm = 25.4 / 96;
    return {
      margin: 0,
      filename: fileName("pdf"),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: 0 },
      // Page is sized to the receipt itself (+ a hair of room) so it always lands on one page
      jsPDF: { unit: "mm", orientation: "portrait", format: [
        el.offsetWidth * pxToMm,
        (thermal ? el.offsetHeight : Math.max(el.offsetHeight, el.offsetWidth * 11 / 8.5)) * pxToMm + 2,
      ] },
      pagebreak: { mode: [] },
    };
  }

  async function withExportStyle(fn) {
    if (!window.html2pdf) { toast("Still loading, try again in a second"); return; }
    const el = $("#receipt");
    el.classList.add("exporting");
    el.style.zoom = "";
    try { await fn(el); }
    catch (err) { console.error(err); toast("Export failed, try Print instead"); }
    finally { el.classList.remove("exporting"); fitPreview(); }
  }

  $("#pdfBtn").onclick = () => withExportStyle((el) => html2pdf().set(exportOptions()).from(el).save());

  $("#pngBtn").onclick = () => withExportStyle(async (el) => {
    const canvas = await html2pdf().set(exportOptions()).from(el).toCanvas().get("canvas");
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = fileName("png");
    a.click();
  });

  $("#printBtn").onclick = () => window.print();

  /* ---------------- Mobile tabs, toast ---------------- */

  $$(".mobile-tabs .tab").forEach((t) => t.onclick = () => {
    $$(".mobile-tabs .tab").forEach((x) => x.classList.toggle("active", x === t));
    $(".workspace").dataset.view = t.dataset.view;
    fitPreview();
  });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------------- Start ---------------- */

  current = state.draft && state.profiles.some((p) => p.id === state.draft.profileId) ? state.draft : newReceipt(profile());
  state.activeProfileId = current.profileId;
  fillForm();
  renderReceipt();

  // Expose for tests in the browser console
  window.BillThis = { get state() { return state; }, get current() { return current; }, totals };
})();
