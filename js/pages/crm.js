import { $, $$, esc, art, icon, toast } from "../ui.js";
import { api, errorText } from "../api.js";
import { ORDER_STATUSES, ORDER_STAGES, REQUEST_STATUSES, INV_STATUSES, SOURCES, CATEGORIES, CRM_EMAIL, DEMO_ADMIN } from "../config.js";

/* =========================================================
   Bine CRM (crm.html). Три главных раздела по шаблонам продавца:
   Заказы — №, тип, контакт, вещи (закупка/продажа/размер), итоги, прибыль;
   Бюджет — №, сумма ±, причина, дата;
   Склад  — название (цвет по статусу), закупка, продажа, размеры ×, кол-во, цвета ×.
   Данные общие с сайтом: orders, requests, products + budget, clients, tasks.
   ========================================================= */

const view = $("#view");
const nf = new Intl.NumberFormat("ru-RU");
const lei = (n) => nf.format(Math.round(n || 0));
const DAY = 864e5;
const startOfDay = (t = Date.now()) => new Date(new Date(t).toDateString()).getTime();
const fmtD = (t) => new Date(t).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
const fmtLong = (t) => new Date(t).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const fmtDT = (t) => new Date(t).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const toDateInput = (t) => new Date(t - new Date(t).getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const num = (v) => (v === "" || v == null ? null : Math.round(+v));
const EDIT_ICON = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>';
const COPY_ICON = '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>';

/* телефон → ключ клиента (8 цифр без +373 / 0) */
function phoneKey(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("373")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}
const tgName = (t) => String(t || "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
const intl = (p) => {
  const k = phoneKey(p);
  return k.length === 8 ? "373" + k : String(p || "").replace(/\D/g, "");
};
const clientKey = (c = {}) => phoneKey(c.phone) || (tgName(c.telegram) ? "tg_" + tgName(c.telegram).toLowerCase() : "");

/* ---------------- state ---------------- */
const D = { orders: [], requests: [], products: [], clients: [], tasks: [], budget: [] };
const S = { view: "orders", q: "", kind: "all", stage: "all", inv: "all", budgetEdit: null };

async function load() {
  const safe = (p) => p.catch((e) => (console.warn(e), []));
  const [orders, requests, products, clients, tasks, budget] = await Promise.all([
    safe(api.orders.all()),
    safe(api.requests.all()),
    safe(api.products.list({ all: true })),
    safe(api.crm.list("clients")),
    safe(api.crm.list("tasks")),
    api.crm.list("budget").catch((e) => {
      if (e?.code === "permission-denied") toast("Обновите правила Firestore — раздел «Бюджет» пока недоступен", "error");
      return [];
    }),
  ]);
  Object.assign(D, { orders, requests, products, clients, tasks, budget });
}

/* ---------------- orders model ---------------- */
const kindOf = (o) => o.kind || "stock";
const itemName = (i) => (i.brand ? `${i.brand} ${i.name || ""}` : i.name || "").trim();
const qtyOf = (i) => +i.qty || 1;
const hasVal = (v) => v !== undefined && v !== null && v !== "";
const costOf = (o) => (o.items || []).reduce((s, i) => s + (+i.cost || 0) * qtyOf(i), 0);
const saleOf = (o) => (o.items || []).reduce((s, i) => s + (+i.price || 0) * qtyOf(i), 0);
const hasCost = (o) => (o.items || []).length > 0 && (o.items || []).every((i) => hasVal(i.cost));
const profitOf = (o) => saleOf(o) - costOf(o);
const label = (o) => (o.num ? `№${o.num}` : o.number || "—");
const stageName = (s) => ORDER_STATUSES[s] || s;
const isOpen = (o) => o.status !== "done" && o.status !== "cancelled";
const nextNum = () => Math.max(0, ...D.orders.map((o) => +o.num || 0), ...D.budget.map((b) => +b.num || 0)) + 1;

/* ---------------- stock model ---------------- */
const pTitle = (p) => `${p.brand || ""} ${p.name || ""}`.trim();
const sumMap = (m) => Object.values(m || {}).reduce((s, n) => s + (+n || 0), 0);
const invOf = (p) => p.invStatus || (p.stockQty && Object.keys(p.stockQty).length && sumMap(p.stockQty) === 0 ? "sold" : "stock");
const pairs = (m) =>
  Object.entries(m || {})
    .filter(([, n]) => n != null)
    .map(([k, n]) => `${esc(k)} ×${n}`)
    .join(", ");

/* ---------------- shell ---------------- */
const VIEWS = {
  orders: ["Заказы", "Заказ"],
  budget: ["Бюджет", "Запись"],
  stock: ["Склад", "Вещь"],
  today: ["Итоги", "Заказ"],
  requests: ["Заявки с сайта", "Заказ"],
  clients: ["Клиенты", "Клиент"],
  tasks: ["Задачи", "Задача"],
  data: ["Данные", "Заказ"],
};
function route() {
  S.view = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "orders";
  $$("#nav a").forEach((a) => a.setAttribute("aria-current", a.dataset.v === S.view ? "page" : "false"));
  $("#title").textContent = VIEWS[S.view][0];
  $("#addLabel").textContent = VIEWS[S.view][1];
  render();
}
function badges() {
  $("#nNew").textContent = D.orders.filter((o) => o.status === "new").length || "";
  $("#nReq").textContent = D.requests.filter((r) => r.status === "new" && !r.orderId).length || "";
  const end = startOfDay() + DAY;
  $("#nTasks").textContent = D.tasks.filter((t) => !t.done && t.due && t.due < end).length || "";
}
function render() {
  badges();
  view.innerHTML = { orders: ordersView, budget: budgetView, stock: stockView, today: todayView, requests: requestsView, clients: clientsView, tasks: tasksView, data: dataView }[S.view]();
  after[S.view]?.();
}
const after = {};

/* =========================================================
   ЗАКАЗЫ
   ========================================================= */
function orderMatches(o, q) {
  if (!q) return true;
  const c = o.contact || {};
  return `${label(o)} ${c.name || ""} ${c.phone || ""} ${c.telegram || ""} ${(o.items || []).map((i) => itemName(i) + " " + (i.size || "")).join(" ")} ${o.notes || ""}`
    .toLowerCase()
    .includes(q);
}
function ordersView() {
  const q = S.q.toLowerCase();
  const list = D.orders
    .filter((o) => (S.kind === "all" || kindOf(o) === S.kind) && (S.stage === "all" || (S.stage === "open" ? isOpen(o) : o.status === S.stage)) && orderMatches(o, q))
    .sort((a, b) => (+b.num || 0) - (+a.num || 0) || b.createdAt - a.createdAt);
  const live = list.filter((o) => o.status !== "cancelled");
  const sumCost = live.reduce((s, o) => s + costOf(o), 0);
  const sumSale = live.reduce((s, o) => s + saleOf(o), 0);
  const stages = [...new Set([...ORDER_STAGES.stock, ...ORDER_STAGES.china])];
  return `
  <div class="pipe-bar">
    ${[["all", "Все"], ["stock", "Из наличия"], ["china", "Под заказ"]].map(([k, t]) => `<button class="chip" data-kind="${k}" aria-pressed="${S.kind === k}">${t}</button>`).join("")}
    <select class="select sel-sm" id="stageFilter" aria-label="Этап">
      <option value="all">Все этапы</option><option value="open"${S.stage === "open" ? " selected" : ""}>В работе</option>
      ${stages.map((s) => `<option value="${s}"${S.stage === s ? " selected" : ""}>${stageName(s)}</option>`).join("")}
    </select>
  </div>
  <div class="sumbar">
    <span>Заказов <b>${list.length}</b></span>
    <span>Закупка <b>${lei(sumCost)}</b></span>
    <span>Продажа <b>${lei(sumSale)}</b></span>
    <span class="pos">Прибыль <b>${lei(sumSale - sumCost)}</b></span>
  </div>
  ${list.length ? `<div class="ocards">${list.map(orderCard).join("")}</div>` : `<div class="empty-state"><div class="empty-orb">${icon.box}</div><p>Заказов нет</p><button class="btn btn-chrome" data-act="newOrder">Новый заказ</button></div>`}`;
}
function orderCard(o) {
  const c = o.contact || {};
  const k = kindOf(o);
  const pr = profitOf(o);
  const tg = tgName(c.telegram);
  const fromSite = !o.num && o.number;
  return `<article class="ocard">
    <header class="oc-h">
      <button class="oc-num" data-edit="${esc(o.id)}">${esc(label(o))}</button>
      <span class="pill ${k === "china" ? "warn" : "ok"}">${k === "china" ? "Под заказ" : "Из наличия"}</span>
      ${fromSite ? `<span class="pill">с сайта</span>` : ""}
      <span class="oc-date">${fmtD(o.createdAt)}</span>
      <select class="select sel-sm" data-ostage="${esc(o.id)}" aria-label="Этап заказа ${esc(label(o))}">
        ${[...new Set([...ORDER_STAGES[k], o.status])].map((s) => `<option value="${s}"${s === o.status ? " selected" : ""}>${stageName(s)}</option>`).join("")}
      </select>
    </header>
    <div class="oc-contact">${[
      c.name ? `<button class="link-plain" data-client="${esc(clientKey(c))}">${esc(c.name)}</button>` : "",
      tg ? `<a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">@${esc(tg)}</a>` : "",
      c.phone ? `<a href="tel:+${intl(c.phone)}">${esc(c.phone)}</a>` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "—"}</div>
    <ol class="oc-items">${(o.items || [])
      .map(
        (i) => `<li><span class="oi-name">${esc(itemName(i))}</span><span class="oi-size">${esc(i.size || "")}${i.color ? ` · ${esc(i.color)}` : ""}${qtyOf(i) > 1 ? ` ×${qtyOf(i)}` : ""}</span>
        <span class="oi-cost">${hasVal(i.cost) ? lei(i.cost) : "—"}</span><span class="oi-price">${lei(i.price)}</span></li>`
      )
      .join("")}</ol>
    <footer class="oc-tot">
      <span>Закупка <b>${hasCost(o) ? lei(costOf(o)) : "—"}</b></span>
      <span>Продажа <b>${lei(saleOf(o))}</b></span>
      <span class="${hasCost(o) ? (pr >= 0 ? "pos" : "neg") : ""}">Прибыль <b>${hasCost(o) ? lei(pr) : "—"}</b></span>
      <span class="oc-acts"><button class="ic-btn" data-copy="${esc(o.id)}" aria-label="Скопировать заказ текстом" title="Скопировать текстом">${COPY_ICON}</button>
      <button class="ic-btn" data-edit="${esc(o.id)}" aria-label="Изменить заказ" title="Изменить">${EDIT_ICON}</button></span>
    </footer>
    ${o.notes ? `<p class="oc-notes">${esc(o.notes)}</p>` : ""}
  </article>`;
}
/* текст заказа ровно по шаблону продавца */
function orderText(o) {
  const c = o.contact || {};
  const contact = [tgName(c.telegram) && "@" + tgName(c.telegram), c.phone, c.name].filter(Boolean).join(" · ");
  return [
    label(o),
    `1. ${kindOf(o) === "china" ? "Под заказ" : "Из наличия"}`,
    `2. ${contact || "—"}`,
    `3. ${(o.items || [])
      .map((i) => `${itemName(i)} ${hasVal(i.cost) ? lei(i.cost) : "—"} / ${lei(i.price)}${i.size ? `, ${i.size} размер` : ""}${i.color ? `, ${i.color}` : ""}${qtyOf(i) > 1 ? ` ×${qtyOf(i)}` : ""}`)
      .join("\n   ")}`,
    `4. ${hasCost(o) ? lei(costOf(o)) : "—"}`,
    `5. ${lei(saleOf(o))}`,
    `6. ${hasCost(o) ? lei(profitOf(o)) : "—"}`,
  ].join("\n");
}
after.orders = () => {
  $("#stageFilter").addEventListener("change", (e) => ((S.stage = e.target.value), render()));
};

/* смена этапа + списание со склада для вещей, выбранных со склада */
const APPLY = (s) => s !== "new" && s !== "cancelled";
async function moveStock(items = [], dir) {
  for (const it of items) {
    if (!it.pid) continue;
    const p = D.products.find((x) => x.id === it.pid);
    if (!p) continue;
    const q = qtyOf(it);
    if (it.size && p.stockQty && p.stockQty[it.size] != null) p.stockQty = { ...p.stockQty, [it.size]: Math.max(0, (+p.stockQty[it.size] || 0) + dir * q) };
    if (it.color && p.colorsQty && p.colorsQty[it.color] != null) p.colorsQty = { ...p.colorsQty, [it.color]: Math.max(0, (+p.colorsQty[it.color] || 0) + dir * q) };
    const total = sumMap(p.stockQty);
    if (p.stockQty && total === 0 && dir < 0) p.invStatus = "sold";
    if (p.stockQty && total > 0 && dir > 0 && p.invStatus === "sold") p.invStatus = "stock";
    await api.products.save(p).catch((e) => toast(errorText(e), "error"));
  }
}
async function setStage(o, status) {
  if (o.status === status) return;
  const patch = { status };
  if (status === "done") patch.doneAt = Date.now();
  if (APPLY(status) && !o.stockApplied) {
    await moveStock(o.items, -1);
    patch.stockApplied = true;
  }
  if (status === "cancelled" && o.stockApplied) {
    await moveStock(o.items, +1);
    patch.stockApplied = false;
  }
  await api.orders.update(o.id, patch);
  Object.assign(o, patch);
  toast(`${label(o)}: ${stageName(status)}`);
}

/* ---------------- форма заказа ---------------- */
const om = $("#orderModal");
const OF = $("#orderForm").elements;
let editingOrder = null;
let fromRequest = null;
$("#srcSel").innerHTML = Object.entries(SOURCES).map(([k, t]) => `<option value="${k}">${t}</option>`).join("");

function itemRow(i = {}) {
  const id = "sz" + Math.random().toString(36).slice(2, 8);
  return `<div class="item-row" data-pid="${esc(i.pid || "")}">
    <input class="input" name="iname" list="stockNames" placeholder="Moncler куртка" value="${esc(itemName(i))}" aria-label="Название вещи" autocomplete="off">
    <input class="input" name="isize" list="${id}" placeholder="43" value="${esc(i.size || "")}" aria-label="Размер" autocomplete="off"><datalist id="${id}"></datalist>
    <input class="input" name="icost" type="number" inputmode="numeric" min="0" placeholder="закуп" value="${hasVal(i.cost) ? i.cost : ""}" aria-label="Закупочная цена">
    <input class="input" name="iprice" type="number" inputmode="numeric" min="0" placeholder="продажа" value="${hasVal(i.price) ? i.price : ""}" aria-label="Продажная цена">
    <button type="button" class="ic-btn" data-rmitem aria-label="Убрать вещь">${icon.close}</button>
    <input type="hidden" name="icolor" value="${esc(i.color || "")}"><input type="hidden" name="iqty" value="${qtyOf(i)}">
  </div>`;
}
function fillSizes(row, p) {
  row.querySelector("datalist").innerHTML = Object.entries(p?.stockQty || {})
    .map(([s, n]) => `<option value="${esc(s)}">${n} шт.</option>`)
    .join("");
}
function readItems() {
  return $$(".item-row", om)
    .map((r) => {
      const v = (n) => r.querySelector(`[name=${n}]`).value.trim();
      const it = { name: v("iname"), size: v("isize"), price: num(v("iprice")) || 0, qty: +v("iqty") || 1 };
      const cost = num(v("icost"));
      if (cost !== null) it.cost = cost;
      if (r.dataset.pid) it.pid = r.dataset.pid;
      if (v("icolor")) it.color = v("icolor");
      return it;
    })
    .filter((i) => i.name);
}
function calcTotals() {
  const o = { items: readItems() };
  const pr = profitOf(o);
  $("#totals").innerHTML = `<div><small>4. Общая закупка</small><b>${hasCost(o) ? lei(costOf(o)) : "—"}</b></div>
    <div><small>5. Общая продажа</small><b>${lei(saleOf(o))}</b></div>
    <div class="${hasCost(o) ? (pr >= 0 ? "pos" : "neg") : ""}"><small>6. Чистая прибыль</small><b>${hasCost(o) ? lei(pr) : "—"}</b></div>`;
}
function syncStages(selected) {
  const list = ORDER_STAGES[OF.kind.value];
  $("#stageSel").innerHTML = list.map((s) => `<option value="${s}"${s === selected ? " selected" : ""}>${stageName(s)}</option>`).join("");
  if (!list.includes(selected)) OF.status.value = "new";
}
function openOrder(o = null, prefill = {}) {
  editingOrder = o;
  fromRequest = prefill.requestId || null;
  const src = o || prefill;
  $("#orderForm").reset();
  $("#omErr").textContent = "";
  $("#omTitle").textContent = o ? `Заказ ${label(o)}` : "Новый заказ";
  $("#omDelete").hidden = !o;
  OF.num.value = o ? o.num || "" : nextNum();
  OF.kind.value = kindOf(src);
  const c = src.contact || {};
  OF.telegram.value = tgName(c.telegram) ? "@" + tgName(c.telegram) : "";
  OF.phone.value = c.phone || "";
  OF.cname.value = c.name || "";
  OF.source.value = src.source || "telegram";
  OF.notes.value = src.notes || "";
  $("#stockNames").innerHTML = D.products
    .filter((p) => invOf(p) !== "sold")
    .map((p) => `<option value="${esc(pTitle(p))}">${hasVal(p.cost) ? lei(p.cost) : "—"} / ${lei(p.price)} · ${sumMap(p.stockQty)} шт.</option>`)
    .join("");
  $("#clientNames").innerHTML = clients()
    .filter((x) => x.name)
    .map((x) => `<option value="${esc(x.name)}">${esc([x.phone, tgName(x.telegram) && "@" + tgName(x.telegram)].filter(Boolean).join(" · "))}</option>`)
    .join("");
  const items = src.items?.length ? src.items : [{}];
  $("#itemRows").innerHTML = items.map(itemRow).join("");
  $$(".item-row", om).forEach((r) => r.dataset.pid && fillSizes(r, D.products.find((p) => p.id === r.dataset.pid)));
  syncStages(o?.status || "new");
  calcTotals();
  om.showModal();
}
$("#addItem").addEventListener("click", () => {
  $("#itemRows").insertAdjacentHTML("beforeend", itemRow());
  $$(".item-row [name=iname]", om).at(-1).focus();
});
om.addEventListener("click", (e) => {
  if (e.target === om || e.target.closest("[data-close]")) return om.close();
  const rm = e.target.closest("[data-rmitem]");
  if (rm) {
    const row = rm.closest(".item-row");
    if ($$(".item-row", om).length > 1) row.remove();
    else {
      $$("input:not([type=hidden])", row).forEach((i) => (i.value = ""));
      row.dataset.pid = "";
    }
    calcTotals();
  }
});
$("#orderForm").addEventListener("input", calcTotals);
$("#orderForm").addEventListener("change", (e) => {
  if (e.target.name === "kind") syncStages(OF.status.value);
  if (e.target.name === "cname") {
    const c = clients().find((x) => x.name === e.target.value);
    if (c) {
      if (!OF.phone.value) OF.phone.value = c.phone || "";
      if (!OF.telegram.value && tgName(c.telegram)) OF.telegram.value = "@" + tgName(c.telegram);
    }
  }
  if (e.target.name === "iname") {
    const row = e.target.closest(".item-row");
    const p = D.products.find((x) => pTitle(x).toLowerCase() === e.target.value.trim().toLowerCase());
    row.dataset.pid = p ? p.id : "";
    if (p) {
      const f = (n) => row.querySelector(`[name=${n}]`);
      if (f("icost").value === "" && hasVal(p.cost)) f("icost").value = p.cost;
      if (f("iprice").value === "" && hasVal(p.price)) f("iprice").value = p.price;
      fillSizes(row, p);
      calcTotals();
    }
  }
});
$("#omDelete").addEventListener("click", async () => {
  const o = editingOrder;
  if (!o || !confirm(`Удалить заказ ${label(o)}?`)) return;
  try {
    if (o.stockApplied) await moveStock(o.items, +1);
    await api.crm.remove("orders", o.id);
    D.orders = D.orders.filter((x) => x.id !== o.id);
    om.close();
    toast(`Заказ ${label(o)} удалён`);
    render();
  } catch (err) {
    toast(errorText(err), "error");
  }
});
$("#orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const items = readItems();
  const err = (t) => ($("#omErr").textContent = t);
  const telegram = tgName(OF.telegram.value);
  const phone = OF.phone.value.trim();
  if (!telegram && phoneKey(phone).length < 6) return err("Укажите Telegram или телефон клиента");
  if (!items.length) return err("Добавьте хотя бы одну вещь");
  const n = Math.round(+OF.num.value) || (editingOrder && !editingOrder.num ? null : nextNum());
  if (n && (D.orders.some((o) => +o.num === n && o.id !== editingOrder?.id) || D.budget.some((b) => +b.num === n))) return err(`Номер №${n} уже занят`);
  const btn = $("#omSave");
  btn.classList.add("loading");
  const o = { items };
  const data = {
    kind: OF.kind.value,
    contact: { ...(editingOrder?.contact || {}), name: OF.cname.value.trim(), telegram, phone },
    items,
    total: saleOf(o),
    costTotal: costOf(o),
    source: OF.source.value,
    notes: OF.notes.value.trim(),
    messenger: telegram ? "telegram" : "phone",
    delivery: editingOrder?.delivery || { type: "meet", city: "", address: "" },
  };
  if (n) Object.assign(data, { num: n, number: `№${n}` });
  const status = OF.status.value;
  try {
    if (editingOrder) {
      const old = editingOrder;
      if (old.stockApplied) await moveStock(old.items, +1);
      data.stockApplied = false;
      await api.orders.update(old.id, data);
      const prev = old.status;
      Object.assign(old, data, { status: "__" });
      await setStage(old, status);
      if (prev === status) toast(`Заказ ${label(old)} сохранён`);
    } else {
      const created = await api.orders.create(data, { manual: true });
      D.orders.unshift(created);
      if (status !== "new") await setStage(created, status);
      if (fromRequest) {
        const r = D.requests.find((x) => x.id === fromRequest);
        const patch = { orderId: created.id, orderNum: n, ...(r?.status === "new" ? { status: "progress" } : {}) };
        await api.requests.update(fromRequest, patch);
        if (r) Object.assign(r, patch);
      }
      toast(`Заказ №${n} создан`);
    }
    om.close();
    if (S.view !== "orders") location.hash = "orders";
    else render();
  } catch (ex) {
    err(errorText(ex));
  }
  btn.classList.remove("loading");
});

/* =========================================================
   БЮДЖЕТ
   ========================================================= */
function budgetView() {
  const q = S.q.toLowerCase();
  const sorted = [...D.budget].sort((a, b) => a.date - b.date || (+a.num || 0) - (+b.num || 0));
  let run = 0;
  const withBal = sorted.map((b) => ((run += +b.amount || 0), { ...b, bal: run }));
  const balance = run;
  const m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const month = D.budget.filter((b) => b.date >= m0);
  const inc = month.filter((b) => b.amount > 0).reduce((s, b) => s + b.amount, 0);
  const out = month.filter((b) => b.amount < 0).reduce((s, b) => s + b.amount, 0);
  const list = withBal.reverse().filter((b) => !q || `${b.num} ${b.reason} ${b.amount}`.toLowerCase().includes(q));
  const ed = S.budgetEdit ? D.budget.find((b) => b.id === S.budgetEdit) : null;
  const mName = new Date().toLocaleDateString("ru-RU", { month: "long" });
  return `
  <div class="kpis">
    <div class="kpi ${balance >= 0 ? "good" : "bad"}"><small>Баланс</small><b>${lei(balance)}</b><em>по всем записям</em></div>
    <div class="kpi good"><small>Приход, ${mName}</small><b>+${lei(inc)}</b></div>
    <div class="kpi bad"><small>Расход, ${mName}</small><b>${lei(out)}</b></div>
    <div class="kpi"><small>Записей</small><b>${D.budget.length}</b></div>
  </div>
  <form class="bform box" id="bForm" novalidate>
    <label class="field"><span>Номер</span><input class="input" name="num" type="number" inputmode="numeric" min="1" value="${ed?.num ?? nextNum()}"></label>
    <div class="field"><span>1. Сумма</span>
      <div class="amount">
        <div class="seg sign" role="radiogroup" aria-label="Приход или расход">
          <label><input type="radio" name="sign" value="-"${!ed || ed.amount < 0 ? " checked" : ""}><span>−</span></label>
          <label><input type="radio" name="sign" value="+"${ed && ed.amount >= 0 ? " checked" : ""}><span>+</span></label>
        </div>
        <input class="input" name="amount" type="number" inputmode="numeric" min="0" placeholder="1400" value="${ed ? Math.abs(ed.amount) : ""}" aria-label="Сумма">
      </div></div>
    <label class="field grow"><span>2. Причина</span><input class="input" name="reason" placeholder="Отдал долг" value="${esc(ed?.reason || "")}"></label>
    <label class="field"><span>3. Дата</span><input class="input" name="date" type="date" value="${toDateInput(ed?.date || Date.now())}"></label>
    <div class="bform-btns">${ed ? `<button type="button" class="btn btn-ghost btn-sm" data-bcancel>Отмена</button>` : ""}<button class="btn btn-chrome btn-sm">${ed ? "Сохранить" : "Добавить"}</button></div>
    <p class="form-err" id="bErr" role="alert"></p>
  </form>
  ${
    list.length
      ? `<div class="box" style="padding:6px 8px;overflow-x:auto"><table class="tbl">
    <thead><tr><th>№</th><th class="num">1. Сумма</th><th>2. Причина</th><th>3. Дата</th><th class="num hide-m">Баланс после</th><th></th></tr></thead>
    <tbody>${list
      .map(
        (b) => `<tr class="click${S.budgetEdit === b.id ? " sel" : ""}" data-bedit="${esc(b.id)}" tabindex="0">
        <td><b>№${esc(b.num ?? "")}</b></td>
        <td class="num ${b.amount < 0 ? "neg" : "pos"}"><b>${b.amount > 0 ? "+" : ""}${lei(b.amount)}</b></td>
        <td>${esc(b.reason)}</td>
        <td>${fmtLong(b.date)}</td>
        <td class="num hide-m muted">${lei(b.bal)}</td>
        <td class="num"><button class="ic-btn" data-bdel="${esc(b.id)}" aria-label="Удалить запись №${esc(b.num ?? "")}">${icon.trash}</button></td></tr>`
      )
      .join("")}</tbody></table></div>`
      : `<div class="empty-state"><div class="empty-orb"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/></svg></div><p>Записей пока нет</p></div>`
  }`;
}
after.budget = () => {
  const f = $("#bForm");
  const F = f.elements;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = Math.round(+F.amount.value);
    const err = (t) => ($("#bErr").textContent = t);
    if (!amount) return err("Укажите сумму"), F.amount.focus();
    if (!F.reason.value.trim()) return err("Укажите причину"), F.reason.focus();
    const n = Math.round(+F.num.value) || nextNum();
    if (D.budget.some((b) => +b.num === n && b.id !== S.budgetEdit) || D.orders.some((o) => +o.num === n)) return err(`Номер №${n} уже занят`);
    const data = {
      ...(S.budgetEdit ? D.budget.find((b) => b.id === S.budgetEdit) : {}),
      num: n,
      amount: F.sign.value === "-" ? -Math.abs(amount) : Math.abs(amount),
      reason: F.reason.value.trim(),
      date: F.date.value ? new Date(F.date.value + "T12:00").getTime() : Date.now(),
    };
    try {
      const saved = await api.crm.save("budget", data);
      const i = D.budget.findIndex((b) => b.id === saved.id);
      i >= 0 ? (D.budget[i] = saved) : D.budget.push(saved);
      toast(`№${n}: ${saved.amount > 0 ? "+" : ""}${lei(saved.amount)} — ${saved.reason}`);
      S.budgetEdit = null;
      render();
    } catch (ex) {
      err(ex?.code === "permission-denied" ? "Нет доступа: обновите правила Firestore" : errorText(ex));
    }
  });
};

/* =========================================================
   СКЛАД
   ========================================================= */
const INV_ORDER = ["stock", "transit", "sold"];
function stockView() {
  const q = S.q.toLowerCase();
  const all = D.products.map((p) => ({ p, inv: invOf(p), n: sumMap(p.stockQty) }));
  const list = all
    .filter((x) => (S.inv === "all" || x.inv === S.inv) && (!q || `${pTitle(x.p)} ${Object.keys(x.p.stockQty || {}).join(" ")} ${Object.keys(x.p.colorsQty || {}).join(" ")}`.toLowerCase().includes(q)))
    .sort((a, b) => INV_ORDER.indexOf(a.inv) - INV_ORDER.indexOf(b.inv) || (b.p.updatedAt || 0) - (a.p.updatedAt || 0));
  const cnt = (s) => all.filter((x) => x.inv === s);
  const units = (s) => cnt(s).reduce((t, x) => t + x.n, 0);
  const invested = all.filter((x) => x.inv !== "sold").reduce((t, x) => t + x.n * (+x.p.cost || 0), 0);
  const expected = all.filter((x) => x.inv !== "sold").reduce((t, x) => t + x.n * (+x.p.price || 0), 0);
  return `
  <div class="kpis">
    <div class="kpi"><small>В наличии</small><b class="c-stock">${units("stock")} шт.</b><em>${cnt("stock").length} позиций</em></div>
    <div class="kpi"><small>В дороге</small><b>${units("transit")} шт.</b><em>${cnt("transit").length} позиций</em></div>
    <div class="kpi"><small>Вложено (закупка)</small><b>${lei(invested)}</b><em>в наличии и в дороге</em></div>
    <div class="kpi good"><small>Ожидаемая выручка</small><b>${lei(expected)}</b><em>прибыль ${lei(expected - invested)}</em></div>
  </div>
  <div class="pipe-bar">
    ${[["all", "Все"], ["stock", "В наличии"], ["transit", "В дороге"], ["sold", "Продано"]].map(([k, t]) => `<button class="chip" data-inv="${k}" aria-pressed="${S.inv === k}">${t} ${k === "all" ? all.length : cnt(k).length}</button>`).join("")}
  </div>
  ${
    list.length
      ? `<div class="inv-list">${list
          .map(
            ({ p, inv, n }) => `<button class="inv inv-${inv}" data-stock="${esc(p.id)}">
          <span class="inv-pic">${p.thumbs?.[0] ? `<img src="${p.thumbs[0]}" alt="">` : art({ ...p, brand: p.brand || p.name }, "art-sm")}</span>
          <span class="inv-body">
            <span class="inv-name">${esc(pTitle(p))}<small>${INV_STATUSES[inv]}${p.published ? " · на сайте" : ""}</small></span>
            <span class="inv-grid">
              <span><em>Закупка</em>${hasVal(p.cost) ? lei(p.cost) : "—"}</span>
              <span><em>Продажа</em>${hasVal(p.price) ? lei(p.price) : "—"}</span>
              <span><em>Размеры</em>${pairs(p.stockQty) || "—"}</span>
              <span><em>Количество</em>${n} шт.</span>
              <span><em>Цвета</em>${pairs(p.colorsQty) || "—"}</span>
            </span>
          </span></button>`
          )
          .join("")}</div>`
      : `<div class="empty-state"><div class="empty-orb">${icon.box}</div><p>На складе пусто</p><button class="btn btn-chrome" data-act="newStock">Добавить вещь</button></div>`
  }`;
}

/* ---------------- форма вещи ---------------- */
const sm = $("#stockModal");
const SF = $("#stockForm").elements;
let editingStock = null;
$("#catSel").innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join("");
const pairRow = (kind, k = "", n = 1) => `<div class="pair">
  <input class="input" name="${kind}Key" value="${esc(k)}" placeholder="${kind === "size" ? "42" : "чёрный"}" aria-label="${kind === "size" ? "Размер" : "Цвет"}">
  <span class="x">×</span>
  <input class="input" name="${kind}Qty" type="number" inputmode="numeric" min="0" value="${n}" aria-label="Количество">
  <button type="button" class="ic-btn" data-rmpair aria-label="Убрать">${icon.close}</button></div>`;
function readPairs(kind) {
  const m = {};
  $$(`#${kind}Rows .pair`).forEach((r) => {
    const k = r.querySelector(`[name=${kind}Key]`).value.trim();
    const n = Math.max(0, Math.round(+r.querySelector(`[name=${kind}Qty]`).value || 0));
    if (k) m[k] = (m[k] || 0) + n;
  });
  return m;
}
function qtyInfo() {
  const a = sumMap(readPairs("size")), colors = readPairs("color"), b = sumMap(colors);
  $("#qtyInfo").innerHTML = `5. Количество: <b>${a} шт.</b>${Object.keys(colors).length && a !== b ? ` <span style="color:var(--amber)">· по цветам ${b} — не совпадает с размерами</span>` : ""}`;
}
function openStock(p = null) {
  editingStock = p;
  $("#stockForm").reset();
  $("#smErr").textContent = "";
  $("#smTitle").textContent = p ? pTitle(p) : "Новая вещь на склад";
  $("#smDelete").hidden = !p;
  SF.title.value = p ? pTitle(p) : "";
  SF.inv.value = p ? invOf(p) : "stock";
  SF.cost.value = p && hasVal(p.cost) ? p.cost : "";
  SF.price.value = p && hasVal(p.price) ? p.price : "";
  SF.cat.value = p?.cat || "Обувь";
  SF.published.checked = !!p?.published;
  const sz = Object.entries(p?.stockQty || {});
  const cl = Object.entries(p?.colorsQty || {});
  $("#sizeRows").innerHTML = (sz.length ? sz : [["", 1]]).map(([k, n]) => pairRow("size", k, n)).join("");
  $("#colorRows").innerHTML = (cl.length ? cl : [["", 1]]).map(([k, n]) => pairRow("color", k, n)).join("");
  qtyInfo();
  sm.showModal();
  setTimeout(() => SF.title.focus(), 50);
}
sm.addEventListener("click", (e) => {
  if (e.target === sm || e.target.closest("[data-close]")) return sm.close();
  const add = e.target.closest("[data-addpair]");
  if (add) {
    $(`#${add.dataset.addpair}Rows`).insertAdjacentHTML("beforeend", pairRow(add.dataset.addpair, "", 1));
    $$(`#${add.dataset.addpair}Rows .pair input`).at(-2).focus();
    qtyInfo();
  }
  const rm = e.target.closest("[data-rmpair]");
  if (rm) {
    rm.closest(".pair").remove();
    qtyInfo();
  }
});
$("#stockForm").addEventListener("input", qtyInfo);
$("#smDelete").addEventListener("click", async () => {
  const p = editingStock;
  if (!p || !confirm(`Удалить «${pTitle(p)}» со склада${p.published ? " и с сайта" : ""}?`)) return;
  try {
    await api.products.remove(p.id);
    D.products = D.products.filter((x) => x.id !== p.id);
    sm.close();
    toast("Удалено");
    render();
  } catch (err) {
    toast(errorText(err), "error");
  }
});
$("#stockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = SF.title.value.trim();
  if (!title) return ($("#smErr").textContent = "Укажите название"), SF.title.focus();
  const stockQty = readPairs("size");
  const colorsQty = readPairs("color");
  const p = editingStock;
  const data = {
    ...(p || { desc: "", featured: false, oldPrice: 0, thumbs: [], imgCount: 0, stock: "stock", sub: "" }),
    ...(!p || title !== pTitle(p) ? { brand: "", name: title } : {}),
    cost: num(SF.cost.value),
    price: num(SF.price.value) || 0,
    stockQty,
    colorsQty,
    sizes: Object.keys(stockQty).length ? Object.keys(stockQty) : p?.sizes || [],
    invStatus: SF.inv.value,
    cat: SF.cat.value,
    published: SF.published.checked,
  };
  const btn = $("#smSave");
  btn.classList.add("loading");
  try {
    const id = await api.products.save(data);
    data.id = id;
    const i = D.products.findIndex((x) => x.id === id);
    i >= 0 ? (D.products[i] = data) : D.products.unshift(data);
    sm.close();
    toast(`${title}: сохранено`);
    render();
  } catch (ex) {
    $("#smErr").textContent = errorText(ex);
  }
  btn.classList.remove("loading");
});

/* =========================================================
   ИТОГИ
   ========================================================= */
function todayView() {
  const m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const mName = new Date().toLocaleDateString("ru-RU", { month: "long" });
  const monthOrders = D.orders.filter((o) => o.createdAt >= m0 && o.status !== "cancelled");
  const sale = monthOrders.reduce((s, o) => s + saleOf(o), 0);
  const cost = monthOrders.reduce((s, o) => s + costOf(o), 0);
  const balance = D.budget.reduce((s, b) => s + (+b.amount || 0), 0);
  const open = D.orders.filter(isOpen);
  const byStage = {};
  open.forEach((o) => (byStage[o.status] = (byStage[o.status] || 0) + 1));
  const end = startOfDay() + DAY;
  const tasks = D.tasks.filter((t) => !t.done && t.due && t.due < end).sort((a, b) => a.due - b.due);
  const reqs = D.requests.filter((r) => r.status === "new" && !r.orderId);
  return `
  <div class="kpis">
    <div class="kpi"><small>Продажи, ${mName}</small><b>${lei(sale)}</b><em>${monthOrders.length} заказов</em></div>
    <div class="kpi"><small>Закупка, ${mName}</small><b>${lei(cost)}</b></div>
    <div class="kpi good"><small>Прибыль, ${mName}</small><b>${lei(sale - cost)}</b></div>
    <div class="kpi ${balance >= 0 ? "" : "bad"}"><small>Баланс бюджета</small><b>${lei(balance)}</b></div>
  </div>
  <div class="cols2">
    <div>
      <div class="box"><div class="box-h"><h2>Заказы в работе · ${open.length}</h2><a href="#orders">Все заказы</a></div>
        ${open.length ? `<div class="rows">${Object.entries(byStage).map(([s, n]) => `<button class="row" data-gostage="${s}"><span class="st st-${s}">${stageName(s)}</span><span></span><span class="r">${n}</span></button>`).join("")}</div>` : `<p class="empty-mini">Все заказы закрыты</p>`}</div>
      <div class="box"><div class="box-h"><h2>Задачи на сегодня</h2><a href="#tasks">Все задачи</a></div>
        ${tasks.length ? tasks.map(taskRow).join("") : `<p class="empty-mini">На сегодня всё сделано</p>`}</div>
    </div>
    <div>
      <div class="box"><div class="box-h"><h2>Новые заявки с сайта · ${reqs.length}</h2><a href="#requests">Все заявки</a></div>
        ${reqs.length ? `<div class="rows">${reqs.slice(0, 6).map((r) => `<a class="row" href="#requests"><span class="ava">${esc((r.contact?.name || "?")[0].toUpperCase())}</span><span><b>${esc(r.title)}</b><small>${esc(r.number)} · ${esc(r.contact?.name || "")}</small></span><span class="r">${fmtD(r.createdAt)}</span></a>`).join("")}</div>` : `<p class="empty-mini">Новых нет</p>`}</div>
      <div class="box"><div class="box-h"><h2>Последние записи бюджета</h2><a href="#budget">Бюджет</a></div>
        ${D.budget.length ? `<div class="rows">${[...D.budget].sort((a, b) => b.date - a.date).slice(0, 5).map((b) => `<div class="row"><span class="ava">№</span><span><b>№${esc(b.num)} · ${esc(b.reason)}</b><small>${fmtLong(b.date)}</small></span><span class="r ${b.amount < 0 ? "neg" : "pos"}">${b.amount > 0 ? "+" : ""}${lei(b.amount)}</span></div>`).join("")}</div>` : `<p class="empty-mini">Записей нет</p>`}</div>
    </div>
  </div>`;
}

/* =========================================================
   ЗАЯВКИ С САЙТА
   ========================================================= */
function requestsView() {
  const q = S.q.toLowerCase();
  const list = D.requests.filter((r) => !q || `${r.number} ${r.title} ${r.contact?.name} ${r.contact?.phone}`.toLowerCase().includes(q));
  return list.length
    ? `<div class="ocards">${list
        .map((r) => {
          const c = r.contact || {};
          return `<article class="ocard">
        <header class="oc-h"><b class="oc-num">${esc(r.number)}</b><span class="oc-date">${fmtDT(r.createdAt)}</span>
          ${r.orderId ? `<span class="pill ok">→ заказ №${esc(r.orderNum)}</span>` : ""}
          <select class="select sel-sm" data-rstage="${esc(r.id)}" aria-label="Статус заявки">${Object.entries(REQUEST_STATUSES).map(([k, t]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${t}</option>`).join("")}</select></header>
        <p class="oc-req"><b>${esc(r.title)}</b>${r.size ? ` · размер ${esc(r.size)}` : ""}${r.color ? ` · ${esc(r.color)}` : ""}${r.budget ? ` · бюджет до ${lei(r.budget)}` : ""}</p>
        ${r.link && /^https?:/i.test(r.link) ? `<p class="oc-notes"><a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${esc(r.link)}</a></p>` : ""}
        ${r.photos?.length ? `<div class="mini-photos">${r.photos.map((p, k) => `<button type="button" data-zoom="${k}" aria-label="Фото ${k + 1}"><img src="${p}" alt="Фото ${k + 1}"></button>`).join("")}</div>` : ""}
        ${r.comment ? `<p class="oc-notes">«${esc(r.comment)}»</p>` : ""}
        <div class="oc-contact">${esc(c.name || "")}${c.phone ? ` · <a href="tel:+${intl(c.phone)}">${esc(c.phone)}</a>` : ""}</div>
        <footer class="oc-tot"><span class="oc-acts">${r.orderId ? "" : `<button class="btn btn-chrome btn-sm" data-req2order="${esc(r.id)}">Оформить заказ</button>`}</span></footer>
      </article>`;
        })
        .join("")}</div>`
    : `<div class="empty-state"><div class="empty-orb">${icon.box}</div><p>Заявок с сайта пока нет</p></div>`;
}

/* =========================================================
   КЛИЕНТЫ
   ========================================================= */
function clients() {
  const map = new Map();
  for (const c of D.clients) {
    const k = clientKey(c) || c.id;
    map.set(k, { ...c, key: k, orders: [] });
  }
  const touch = (c, o) => {
    const k = clientKey(c);
    if (!k) return;
    if (!map.has(k)) map.set(k, { id: "c" + k, key: k, name: c.name || "", phone: c.phone || "", telegram: c.telegram || "", tags: [], orders: [] });
    const x = map.get(k);
    x.name ||= c.name || "";
    x.phone ||= c.phone || "";
    x.telegram ||= c.telegram || "";
    if (o) x.orders.push(o);
  };
  D.orders.forEach((o) => touch(o.contact || {}, o));
  D.requests.forEach((r) => touch(r.contact || {}, null));
  return [...map.values()].map((c) => {
    const live = c.orders.filter((o) => o.status !== "cancelled");
    return {
      ...c,
      spent: live.reduce((s, o) => s + saleOf(o), 0),
      profit: live.reduce((s, o) => s + (hasCost(o) ? profitOf(o) : 0), 0),
      last: Math.max(c.updatedAt || 0, ...c.orders.map((o) => o.createdAt || 0)),
    };
  });
}
const cName = (c) => c.name || (tgName(c.telegram) ? "@" + tgName(c.telegram) : c.phone) || "Без имени";
function clientsView() {
  const q = S.q.toLowerCase();
  const list = clients()
    .filter((c) => !q || `${c.name} ${c.phone} ${c.telegram} ${(c.tags || []).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) => b.last - a.last);
  return list.length
    ? `<div class="box" style="padding:6px 8px;overflow-x:auto"><table class="tbl">
    <thead><tr><th>Клиент</th><th class="hide-m">Контакт</th><th class="num">Заказов</th><th class="num">Купил на</th><th class="num hide-m">Прибыль</th></tr></thead>
    <tbody>${list
      .map(
        (c) => `<tr class="click" data-client="${esc(c.key)}" tabindex="0">
        <td><div style="display:flex;gap:10px;align-items:center"><span class="ava ${c.spent ? "c" : ""}">${esc(cName(c).replace("@", "")[0].toUpperCase())}</span><b style="font-size:14px">${esc(cName(c))}</b></div></td>
        <td class="hide-m muted">${esc([tgName(c.telegram) && "@" + tgName(c.telegram), c.phone].filter(Boolean).join(" · "))}</td>
        <td class="num">${c.orders.length}</td><td class="num">${c.spent ? lei(c.spent) : "—"}</td><td class="num hide-m">${c.profit ? lei(c.profit) : "—"}</td></tr>`
      )
      .join("")}</tbody></table></div>`
    : `<div class="empty-state"><div class="empty-orb">${icon.user}</div><p>Клиенты появятся из заказов</p></div>`;
}

const panel = $("#panel");
function openPanel(title, body, foot = "") {
  $("#pTitle").textContent = title;
  $("#pBody").innerHTML = body;
  $("#pFoot").innerHTML = foot;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  $("#pScrim").hidden = false;
}
function closePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  $("#pScrim").hidden = true;
}
$("#pClose").addEventListener("click", closePanel);
$("#pScrim").addEventListener("click", closePanel);

function openClient(key) {
  const c = clients().find((x) => x.key === key) || { key: "", name: "", phone: "", telegram: "", tags: [], orders: [] };
  const tg = tgName(c.telegram);
  openPanel(
    key ? cName(c) : "Новый клиент",
    `${c.orders.length ? `<div class="calc"><div><small>Купил на</small><b>${lei(c.spent)}</b></div><div class="pos"><small>Прибыль с клиента</small><b>${lei(c.profit)}</b></div></div>` : ""}
    <div class="contact-btns">${tg ? `<a class="btn btn-ghost" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">Telegram</a>` : ""}${c.phone ? `<a class="btn btn-ghost" href="tel:+${intl(c.phone)}">Позвонить</a>` : ""}</div>
    <form id="clientEdit" class="stack" novalidate>
      <div class="row2">
        <label class="field"><span>Имя</span><input class="input" name="cname" value="${esc(c.name || "")}"></label>
        <label class="field"><span>Telegram</span><input class="input" name="telegram" value="${tg ? "@" + esc(tg) : ""}" placeholder="@username"></label>
        <label class="field"><span>Телефон</span><input class="input" name="phone" type="tel" value="${esc(c.phone || "")}"></label>
        <label class="field"><span>Размеры</span><input class="input" name="sizes" value="${esc(c.sizesNote || "")}" placeholder="обувь 43, одежда M"></label>
      </div>
      <label class="field"><span>Метки через запятую</span><input class="input" name="tags" value="${esc((c.tags || []).join(", "))}" placeholder="постоянный, перекуп"></label>
      <label class="field"><span>Заметки</span><textarea class="textarea" name="notes" rows="3">${esc(c.notes || "")}</textarea></label>
    </form>
    ${c.orders.length ? `<div class="ps-sec"><h3>Заказы · ${c.orders.length}</h3><div class="rows">${c.orders.map((o) => `<button class="row" data-edit="${esc(o.id)}"><span class="ava">${esc(String(o.num || "•"))}</span><span><b>${esc((o.items || []).map(itemName).join(", "))}</b><small>${esc(label(o))} · ${stageName(o.status)} · ${fmtD(o.createdAt)}</small></span><span class="r">${lei(saleOf(o))}</span></button>`).join("")}</div></div>` : ""}`,
    `${key ? `<button class="btn btn-ghost" data-orderfor="${esc(c.key)}">Новый заказ</button>` : ""}<button class="btn btn-chrome" id="clientSave">Сохранить</button>`
  );
  $("#clientSave").addEventListener("click", async () => {
    const F = $("#clientEdit").elements;
    const data = { name: F.cname.value.trim(), telegram: tgName(F.telegram.value), phone: F.phone.value.trim(), sizesNote: F.sizes.value.trim(), tags: F.tags.value.split(",").map((t) => t.trim()).filter(Boolean), notes: F.notes.value.trim() };
    const k = clientKey(data);
    if (!k) return toast("Укажите Telegram или телефон", "error");
    try {
      const saved = await api.crm.save("clients", { ...D.clients.find((x) => clientKey(x) === k), ...data, id: "c" + k });
      const i = D.clients.findIndex((x) => x.id === saved.id);
      i >= 0 ? (D.clients[i] = saved) : D.clients.unshift(saved);
      toast("Клиент сохранён");
      closePanel();
      render();
    } catch (err) {
      toast(errorText(err), "error");
    }
  });
}

/* =========================================================
   ЗАДАЧИ
   ========================================================= */
const TT = { meet: "Встреча", call: "Позвонить", task: "Задача" };
function taskRow(t) {
  const late = !t.done && t.due && t.due < Date.now();
  return `<div class="task ${t.done ? "done" : ""}">
    <label class="check"><input type="checkbox" data-tdone="${esc(t.id)}" ${t.done ? "checked" : ""} aria-label="Готово"></label>
    <span><b>${TT[t.type] || ""}: ${esc(t.title)}</b><small class="${late ? "late" : ""}">${t.due ? fmtDT(t.due) : "без срока"}${t.place ? ` · ${esc(t.place)}` : ""}</small></span>
    <button class="ic-btn" data-tdel="${esc(t.id)}" aria-label="Удалить задачу">${icon.trash}</button></div>`;
}
function tasksView() {
  const t0 = startOfDay();
  const groups = [
    ["Просрочено", (t) => !t.done && t.due && t.due < t0],
    ["Сегодня", (t) => !t.done && t.due >= t0 && t.due < t0 + DAY],
    ["Позже", (t) => !t.done && (!t.due || t.due >= t0 + DAY)],
    ["Сделано", (t) => t.done],
  ];
  const nowLocal = new Date(Date.now() + 36e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  return `<form class="task-form" id="taskForm">
    <select class="select" name="type" aria-label="Тип">${Object.entries(TT).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
    <input class="input" name="title" placeholder="Что сделать" aria-label="Задача">
    <input class="input" name="due" type="datetime-local" value="${nowLocal}" aria-label="Когда">
    <button class="btn btn-chrome btn-sm" style="height:44px">Добавить</button>
    <input class="input" name="place" placeholder="Место (необязательно)" aria-label="Место" style="grid-column:1/-1">
  </form>
  ${groups
    .map(([n, fn]) => {
      const l = D.tasks.filter(fn).sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
      return l.length ? `<div class="tgroup box"><h3>${n} · ${l.length}</h3>${l.map(taskRow).join("")}</div>` : "";
    })
    .join("") || `<div class="empty-state"><div class="empty-orb">${icon.check}</div><p>Задач нет</p></div>`}`;
}
after.tasks = () => {
  $("#taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const F = e.target.elements;
    if (!F.title.value.trim()) return F.title.focus();
    await saveTask({ type: F.type.value, title: F.title.value.trim(), due: F.due.value ? new Date(F.due.value).getTime() : null, place: F.place.value.trim() });
    render();
  });
};
async function saveTask(t) {
  try {
    const saved = await api.crm.save("tasks", { done: false, ...t });
    const i = D.tasks.findIndex((x) => x.id === saved.id);
    i >= 0 ? (D.tasks[i] = saved) : D.tasks.unshift(saved);
  } catch (err) {
    toast(errorText(err), "error");
  }
}

/* =========================================================
   ДАННЫЕ
   ========================================================= */
function dataView() {
  return `<div class="cols2">
    <div class="box"><div class="box-h"><h2>Где хранятся данные</h2></div>
      <p class="muted">${api.mode === "demo" ? "Демо-режим: всё лежит только в этом браузере." : "Firebase: данные общие для вас, напарника и сайта."} Заказы покупателей и заявки с сайта попадают сюда сами, склад — это те же товары, что на сайте.</p></div>
    <div class="box"><div class="box-h"><h2>Резервная копия</h2></div>
      <p class="muted">Файл со складом (с фото), заказами, бюджетом, заявками, клиентами и задачами.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-chrome btn-sm" id="exportBtn">${icon.upload} Скачать копию</button>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">Загрузить копию<input type="file" id="importFile" accept="application/json,.json" hidden></label></div>
      <p class="form-err" id="dataErr"></p></div>
  </div>`;
}
after.data = () => {
  $("#exportBtn").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.classList.add("loading");
    const images = {};
    for (const p of D.products) if (p.imgCount) images[p.id] = await api.products.images(p.id).catch(() => []);
    const dump = { app: "bine-crm", version: 2, exportedAt: new Date().toISOString(), products: D.products, images, orders: D.orders, requests: D.requests, budget: D.budget, clients: D.clients, tasks: D.tasks };
    const url = URL.createObjectURL(new Blob([JSON.stringify(dump)], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: `bine-crm-${new Date().toISOString().slice(0, 10)}.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    b.classList.remove("loading");
  });
  $("#importFile").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dump = JSON.parse(await f.text());
      if (dump.app !== "bine-crm") throw new Error("Это не файл копии Bine CRM");
      toast("Загружаю копию…");
      for (const p of dump.products || []) {
        const imgs = dump.images?.[p.id];
        await api.products.save(p, imgs?.length ? imgs.map((full, i) => ({ full, thumb: p.thumbs?.[i] || (i < 2 ? full : null) })) : undefined);
      }
      for (const col of ["orders", "requests", "budget", "clients", "tasks"]) for (const x of dump[col] || []) await api.crm.save(col, x);
      await load();
      toast("Копия загружена");
      render();
    } catch (err) {
      $("#dataErr").textContent = errorText(err);
    }
    e.target.value = "";
  });
};

/* =========================================================
   события
   ========================================================= */
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.closest("dialog") && !t.closest("[data-zoom]")) return; // формы обрабатывают свои клики сами
  const ed = t.closest("[data-edit]");
  if (ed) {
    closePanel();
    return openOrder(D.orders.find((o) => o.id === ed.dataset.edit));
  }
  const cp = t.closest("[data-copy]");
  if (cp) {
    const o = D.orders.find((x) => x.id === cp.dataset.copy);
    try {
      await navigator.clipboard.writeText(orderText(o));
      toast(`${label(o)} скопирован текстом`);
    } catch {
      toast("Не удалось скопировать", "error");
    }
    return;
  }
  const st = t.closest("[data-stock]");
  if (st) return openStock(D.products.find((p) => p.id === st.dataset.stock));
  const cl = t.closest("[data-client]");
  if (cl && cl.dataset.client) return openClient(cl.dataset.client);
  const of = t.closest("[data-orderfor]");
  if (of) {
    const c = clients().find((x) => x.key === of.dataset.orderfor) || {};
    closePanel();
    return openOrder(null, { contact: { name: c.name, phone: c.phone, telegram: c.telegram } });
  }
  const rq = t.closest("[data-req2order]");
  if (rq) {
    const r = D.requests.find((x) => x.id === rq.dataset.req2order);
    return openOrder(null, { kind: "china", source: "site", requestId: r.id, contact: { name: r.contact?.name, phone: r.contact?.phone }, items: [{ name: r.title, size: r.size || "", price: r.price || null }], notes: r.comment || "" });
  }
  if (t.closest("#addBtn") || t.closest("[data-act=newOrder]") || t.closest("[data-act=newStock]")) {
    if (S.view === "stock" || t.closest("[data-act=newStock]")) return openStock();
    if (S.view === "budget") return $("#bForm [name=amount]").focus();
    if (S.view === "clients") return openClient("");
    if (S.view === "tasks") return $("#taskForm [name=title]").focus();
    return openOrder();
  }
  const k = t.closest("[data-kind]");
  if (k) return (S.kind = k.dataset.kind), render();
  const iv = t.closest("[data-inv]");
  if (iv) return (S.inv = iv.dataset.inv), render();
  const gs = t.closest("[data-gostage]");
  if (gs) return (S.stage = gs.dataset.gostage), (location.hash = "orders");
  const bd = t.closest("[data-bdel]");
  if (bd) {
    const b = D.budget.find((x) => x.id === bd.dataset.bdel);
    if (!confirm(`Удалить запись №${b.num} (${lei(b.amount)} — ${b.reason})?`)) return;
    await api.crm.remove("budget", b.id).catch((err) => toast(errorText(err), "error"));
    D.budget = D.budget.filter((x) => x.id !== b.id);
    if (S.budgetEdit === b.id) S.budgetEdit = null;
    return render();
  }
  const be = t.closest("[data-bedit]");
  if (be) {
    S.budgetEdit = be.dataset.bedit;
    render();
    return $("#bForm [name=amount]").focus();
  }
  if (t.closest("[data-bcancel]")) return (S.budgetEdit = null), render();
  const del = t.closest("[data-tdel]");
  if (del) {
    await api.crm.remove("tasks", del.dataset.tdel).catch((err) => toast(errorText(err), "error"));
    D.tasks = D.tasks.filter((x) => x.id !== del.dataset.tdel);
    return render();
  }
  const zb = t.closest("[data-zoom]");
  if (zb) {
    const d = document.createElement("dialog");
    d.className = "lightbox";
    d.innerHTML = `<img src="${zb.querySelector("img").src}" alt=""><button class="ic-btn" aria-label="Закрыть">${icon.close}</button>`;
    document.body.appendChild(d);
    d.addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    d.showModal();
  }
});
document.addEventListener("change", async (e) => {
  const os = e.target.dataset?.ostage;
  if (os) {
    const o = D.orders.find((x) => x.id === os);
    try {
      await setStage(o, e.target.value);
      render();
    } catch (err) {
      toast(errorText(err), "error");
    }
    return;
  }
  const rs = e.target.dataset?.rstage;
  if (rs) {
    await api.requests.update(rs, { status: e.target.value }).catch((err) => toast(errorText(err), "error"));
    D.requests.find((x) => x.id === rs).status = e.target.value;
    return badges();
  }
  const td = e.target.dataset?.tdone;
  if (td) {
    await saveTask({ ...D.tasks.find((x) => x.id === td), done: e.target.checked });
    render();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("tr[data-client]")) openClient(e.target.dataset.client);
  if (e.key === "Enter" && e.target.matches("tr[data-bedit]")) e.target.click();
  if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
});
let qt;
$("#q").addEventListener("input", (e) => {
  clearTimeout(qt);
  qt = setTimeout(() => ((S.q = e.target.value.trim()), render()), 200);
});
addEventListener("hashchange", route);

/* =========================================================
   вход по паролю: CRM входит в аккаунт администратора
   (CRM_EMAIL в Firebase, DEMO_ADMIN в демо-режиме). Пароль в коде не хранится.
   ========================================================= */
const LOGIN_EMAIL = api.mode === "demo" ? DEMO_ADMIN.email : CRM_EMAIL;
let started = false;
function showGate(msg = "") {
  started = false;
  const guard = $("#guard");
  guard.hidden = false;
  guard.innerHTML = `<form class="box" id="gate" novalidate>
      <img src="assets/logo.jpg" alt="" width="72" height="72">
      <h1>Bine CRM</h1>
      <p class="muted">Введите пароль</p>
      <span class="pass-wrap" style="display:block;margin-top:18px"><input class="input" id="gatePass" type="password" autocomplete="current-password" aria-label="Пароль" required>
        <button type="button" class="ic-btn" id="gateEye" aria-label="Показать пароль">${icon.eye}</button></span>
      <p class="form-err" id="gateErr" role="alert" style="margin:10px 0">${esc(msg)}</p>
      <button class="btn btn-chrome btn-block" id="gateBtn">Войти</button>
    </form>`;
  const inp = $("#gatePass");
  setTimeout(() => inp.focus(), 50);
  $("#gateEye").addEventListener("click", () => (inp.type = inp.type === "password" ? "text" : "password"));
  $("#gate").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!inp.value) return inp.focus();
    const btn = $("#gateBtn");
    btn.classList.add("loading");
    try {
      await api.auth.signIn(LOGIN_EMAIL, inp.value);
    } catch (err) {
      btn.classList.remove("loading");
      $("#gateErr").textContent = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(err?.code) ? "Неверный пароль" : errorText(err);
      inp.select();
    }
  });
}
async function start() {
  $("#guard").hidden = true;
  if (started) return;
  started = true;
  $("#demoNote").hidden = api.mode !== "demo";
  view.innerHTML = `<div class="kpis">${'<div class="kpi sk" style="height:96px"></div>'.repeat(4)}</div>`;
  await load();
  route();
}
$("#logout").addEventListener("click", () => api.auth.signOut());
api.auth.onChange((u) => {
  if (u?.isAdmin) return start();
  if (u) {
    api.auth.signOut();
    return showGate("У этого аккаунта нет прав администратора.");
  }
  showGate();
});
