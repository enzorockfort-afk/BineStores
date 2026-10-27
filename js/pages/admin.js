import { initLayout, $, $$, esc, money, art, icon, toast, tag, reveal } from "../ui.js";
import { api, errorText } from "../api.js";
import { CATEGORIES, ORDER_STATUSES, REQUEST_STATUSES, SUBCATEGORIES, SIZE_SETS, WAIST_SUBS } from "../config.js";
import { SEED } from "../seed.js";
import { orderHtml, requestHtml } from "../orders-view.js";
import { compress, isImageFile } from "../images.js";

await initLayout("");
const view = $("#view");

/* ---------------- image processing ---------------- */
async function processFile(file) {
  const url = URL.createObjectURL(file);
  try {
    let full = await compress(url, 1400, 0.82);
    if (full.length > 700_000) full = await compress(url, 1100, 0.72);
    return { full, thumb: await compress(url, 560, 0.72) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------------- confirm ---------------- */
function confirmBox(title, text, yes = "Удалить") {
  const d = $("#confirm");
  $("#cfTitle").textContent = title;
  $("#cfText").textContent = text;
  $("#cfYes").textContent = yes;
  d.showModal();
  return new Promise((res) => {
    const done = (v) => {
      d.close();
      $("#cfYes").onclick = $("#cfNo").onclick = null;
      res(v);
    };
    $("#cfYes").onclick = () => done(true);
    $("#cfNo").onclick = () => done(false);
    d.onclose = () => res(false);
  });
}

/* ---------------- state ---------------- */
let products = [];
let orders = [];
let requests = [];
const S = { tab: "overview", q: "", pf: "all", of: "all", rf: "all" };

async function load() {
  [products, orders, requests] = await Promise.all([
    api.products.list({ all: true }),
    api.orders.all().catch(() => []),
    api.requests.all().catch(() => []),
  ]);
  products.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
}

function shell() {
  const newCount = orders.filter((o) => o.status === "new").length;
  const newReq = requests.filter((r) => r.status === "new").length;
  view.innerHTML = `
    <div class="page-head">
      <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><a href="account.html"><span>Кабинет</span></a><span>Админ-панель</span></nav>
      <h1 class="page-title chrome-t">Админка</h1>
    </div>
    <div class="adm-tabs" role="tablist">
      <button role="tab" data-tab="overview">${icon.chart}Обзор</button>
      <button role="tab" data-tab="products">${icon.grid}Товары <span class="n" style="background:var(--carbon-3);color:var(--mist)">${products.length}</span></button>
      <button role="tab" data-tab="orders">${icon.box}Заказы ${newCount ? `<span class="n">${newCount}</span>` : ""}</button>
      <button role="tab" data-tab="requests">${icon.plane}Заявки ${newReq ? `<span class="n">${newReq}</span>` : ""}</button>
    </div>
    <div id="panel"></div>`;
  $(".adm-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) (S.tab = b.dataset.tab), (location.hash = S.tab), render();
  });
  render();
}

function render() {
  $$(".adm-tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === S.tab));
  const p = $("#panel");
  p.innerHTML = { overview, products: productsPanel, orders: ordersPanel, requests: requestsPanel }[S.tab]();
  p.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" });
  reveal(p);
}

/* ---------------- overview ---------------- */
function overview() {
  const active = orders.filter((o) => o.status !== "cancelled");
  const revenue = orders.filter((o) => o.status === "done").reduce((s, o) => s + o.total, 0);
  const pending = active.filter((o) => o.status !== "done").reduce((s, o) => s + o.total, 0);
  return `
    <div class="stats">
      <div class="stat" data-reveal><small>Новые заказы / заявки</small><b>${orders.filter((o) => o.status === "new").length} / ${requests.filter((r) => r.status === "new").length}</b></div>
      <div class="stat" data-reveal style="--d:1"><small>В работе, лей</small><b>${money(pending).replace(" лей", "")}</b></div>
      <div class="stat" data-reveal style="--d:2"><small>Выручка, лей</small><b>${money(revenue).replace(" лей", "")}</b></div>
      <div class="stat" data-reveal style="--d:3"><small>Товары / черновики</small><b>${products.filter((p) => p.published).length} / ${products.filter((p) => !p.published).length}</b></div>
    </div>
    <div class="adm-bar">
      <button class="btn btn-chrome" data-act="new">${icon.plus} Добавить товар</button>
      ${products.length ? "" : `<button class="btn btn-ghost" data-act="seed">Загрузить демо-товары</button>`}
    </div>
    <div class="sec-head" style="margin:36px 0 16px"><h2 class="h2" style="font-size:32px">Последние заказы</h2>${orders.length ? `<button class="link-u" data-go="orders">Все заказы ${icon.arrow}</button>` : ""}</div>
    ${
      orders.length
        ? `<div class="orders adm-orders">${orders.slice(0, 5).map((o, i) => orderHtml(o, i, true)).join("")}</div>`
        : `<div class="empty-state"><div class="empty-orb">${icon.box}</div><p>Заказов пока нет</p></div>`
    }`;
}

/* ---------------- products ---------------- */
function productsPanel() {
  const q = S.q.toLowerCase();
  const list = products.filter(
    (p) =>
      (S.pf === "all" || (S.pf === "pub" ? p.published : !p.published)) &&
      (!q || `${p.brand} ${p.name} ${p.cat}`.toLowerCase().includes(q))
  );
  return `
    <div class="adm-bar">
      <label class="tb-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input class="input" type="search" id="pq" placeholder="Поиск товара" value="${esc(S.q)}" aria-label="Поиск товара"></label>
      ${[["all", "Все"], ["pub", "Опубликованы"], ["draft", "Черновики"]]
        .map(([k, t]) => `<button class="chip" data-pf="${k}" aria-pressed="${S.pf === k}">${t}</button>`)
        .join("")}
      <button class="btn btn-chrome btn-sm" data-act="new" style="margin-left:auto">${icon.plus} Добавить</button>
    </div>
    <div class="adm-list">
      ${
        list
          .map(
            (p, i) => `<div class="adm-row" style="--i:${i}">
          <span class="line-pic">${p.thumbs?.[0] ? `<img src="${p.thumbs[0]}" alt="${esc(p.brand + " " + p.name)}">` : art(p, "art-sm")}</span>
          <span><b>${esc(p.brand)} ${esc(p.name)}</b><small>${esc(p.cat)} · ${p.imgCount || 0} фото${p.featured ? " · на главной" : ""}</small></span>
          <span class="hide-m">${tag(p.stock)}</span>
          <span class="hide-m"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<small><s>${money(p.oldPrice)}</s></small>` : ""}</span>
          <label class="pub hide-m"><span class="switch"><input type="checkbox" data-pub="${esc(p.id)}"${p.published ? " checked" : ""} aria-label="Опубликован"></span></label>
          <span class="acts">
            <a class="ic-btn hide-m" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" aria-label="Открыть на сайте">${icon.eye}</a>
            <button class="ic-btn" data-edit="${esc(p.id)}" aria-label="Редактировать">${icon.edit}</button>
            <button class="ic-btn del" data-del="${esc(p.id)}" aria-label="Удалить">${icon.trash}</button>
          </span>
        </div>`
          )
          .join("") || `<div class="empty-state"><div class="empty-orb">${icon.grid}</div><p>Товаров нет</p></div>`
      }
    </div>`;
}

/* ---------------- orders ---------------- */
function ordersPanel() {
  const list = orders.filter((o) => S.of === "all" || o.status === S.of);
  return `
    <div class="adm-bar" style="overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none">
      <button class="chip" data-of="all" aria-pressed="${S.of === "all"}">Все ${orders.length}</button>
      ${Object.entries(ORDER_STATUSES)
        .map(([k, t]) => {
          const n = orders.filter((o) => o.status === k).length;
          return n ? `<button class="chip" data-of="${k}" aria-pressed="${S.of === k}">${t} ${n}</button>` : "";
        })
        .join("")}
    </div>
    ${
      list.length
        ? `<div class="orders adm-orders">${list.map((o, i) => orderHtml(o, i, true)).join("")}</div>`
        : `<div class="empty-state"><div class="empty-orb">${icon.box}</div><p>Заказов нет</p></div>`
    }`;
}

/* ---------------- requests ---------------- */
function requestsPanel() {
  const list = requests.filter((r) => S.rf === "all" || r.status === S.rf);
  return `
    <div class="adm-bar" style="overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none">
      <button class="chip" data-rf="all" aria-pressed="${S.rf === "all"}">Все ${requests.length}</button>
      ${Object.entries(REQUEST_STATUSES)
        .map(([k, t]) => {
          const n = requests.filter((r) => r.status === k).length;
          return n ? `<button class="chip" data-rf="${k}" aria-pressed="${S.rf === k}">${t} ${n}</button>` : "";
        })
        .join("")}
    </div>
    ${
      list.length
        ? `<div class="orders adm-orders">${list.map((r, i) => requestHtml(r, i, true)).join("")}</div>`
        : `<div class="empty-state"><div class="empty-orb">${icon.plane}</div><p>Заявок нет</p></div>`
    }`;
}

/* ---------------- events ---------------- */
view.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-act],[data-edit],[data-del],[data-pf],[data-of],[data-rf],[data-go]");
  if (!t) return;
  if (t.dataset.go) return (S.tab = t.dataset.go), render();
  if (t.dataset.pf) return (S.pf = t.dataset.pf), render();
  if (t.dataset.of) return (S.of = t.dataset.of), render();
  if (t.dataset.rf) return (S.rf = t.dataset.rf), render();
  if (t.dataset.act === "new") return openEditor();
  if (t.dataset.edit) return openEditor(products.find((p) => p.id === t.dataset.edit));
  if (t.dataset.act === "seed") {
    t.classList.add("loading");
    for (const p of SEED) await api.products.save({ ...p });
    await load();
    toast(`Добавлено ${SEED.length} демо-товаров`);
    return shell();
  }
  if (t.dataset.del) {
    const p = products.find((x) => x.id === t.dataset.del);
    if (!(await confirmBox("Удалить товар?", `${p.brand} ${p.name} будет удалён вместе с фото.`))) return;
    try {
      await api.products.remove(p.id);
      products = products.filter((x) => x.id !== p.id);
      toast("Товар удалён");
      render();
    } catch (err) {
      toast(errorText(err), "error");
    }
  }
});
view.addEventListener("input", (e) => {
  if (e.target.id === "pq") {
    S.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const i = $("#pq");
    i.focus();
    i.setSelectionRange(pos, pos);
  }
});
view.addEventListener("change", async (e) => {
  const pub = e.target.dataset.pub;
  if (pub) {
    const p = products.find((x) => x.id === pub);
    p.published = e.target.checked;
    try {
      await api.products.save(p);
      toast(p.published ? "Опубликовано" : "Снято с публикации");
    } catch (err) {
      e.target.checked = !e.target.checked;
      p.published = e.target.checked;
      toast(errorText(err), "error");
    }
  }
  const rs = e.target.dataset.rstatus;
  if (rs) {
    const r = requests.find((x) => x.id === rs);
    try {
      await api.requests.setStatus(rs, e.target.value);
      r.status = e.target.value;
      toast(`Заявка ${r.number}: ${REQUEST_STATUSES[r.status]}`);
      const badge = e.target.closest("details").querySelector("summary .st");
      badge.textContent = REQUEST_STATUSES[r.status];
      badge.className = `st st-${r.status === "progress" || r.status === "offered" ? "confirmed" : r.status}`;
    } catch (err) {
      e.target.value = r.status;
      toast(errorText(err), "error");
    }
  }
  const st = e.target.dataset.status;
  if (st) {
    const o = orders.find((x) => x.id === st);
    try {
      await api.orders.setStatus(st, e.target.value);
      o.status = e.target.value;
      toast(`Заказ ${o.number}: ${ORDER_STATUSES[o.status]}`);
      const det = e.target.closest("details");
      const wasOpen = det?.open;
      render();
      if (wasOpen) $$("details.order").find((d) => d.innerHTML.includes(o.number))?.setAttribute("open", "");
    } catch (err) {
      toast(errorText(err), "error");
    }
  }
});

/* ---------------- editor ---------------- */
const ed = $("#editor");
const EF = $("#edForm").elements;
let editing = null;
let imgs = [];
let sizes = new Set();

$("#catSel").innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join("");

function renderSubs(selected = "") {
  const list = SUBCATEGORIES[EF.cat.value] || [];
  $("#subSel").innerHTML = `<option value="">Без подкатегории</option>` + list.map((s) => `<option${s === selected ? " selected" : ""}>${s}</option>`).join("");
}
/* размеры для выбора зависят от категории: обувь 30–48, одежда XXS–XXXL (+ талия для низа) */
function presetSizes() {
  const cat = EF.cat.value;
  if (cat === "Обувь") return SIZE_SETS.shoes;
  if (cat === "Одежда") return WAIST_SUBS.includes(EF.sub.value) ? [...SIZE_SETS.waist, ...SIZE_SETS.clothes] : SIZE_SETS.clothes;
  return SIZE_SETS.one;
}
EF.cat.addEventListener("change", () => (renderSubs(), renderSizes()));
EF.sub.addEventListener("change", renderSizes);

function renderSizes() {
  const all = [...new Set([...presetSizes(), ...sizes])];
  $("#sizePick").innerHTML = all.map((s) => `<button type="button" class="chip" data-s="${esc(s)}" aria-pressed="${sizes.has(s)}">${esc(s)}</button>`).join("");
}
$("#sizePick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-s]");
  if (!b) return;
  sizes.has(b.dataset.s) ? sizes.delete(b.dataset.s) : sizes.add(b.dataset.s);
  b.setAttribute("aria-pressed", sizes.has(b.dataset.s));
});
const addCustom = () => {
  const v = $("#customSize").value.trim();
  if (!v) return;
  sizes.add(v);
  $("#customSize").value = "";
  renderSizes();
};
$("#addSize").addEventListener("click", addCustom);
$("#customSize").addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), addCustom()));

function renderImgs() {
  $("#imgs").innerHTML = imgs
    .map(
      (im, i) => `<div class="img-tile${im.busy ? " busy" : ""}" draggable="${!im.busy}" data-i="${i}">
        ${im.thumb || im.full ? `<img src="${im.thumb || im.full}" alt="Фото ${i + 1}">` : ""}
        ${i === 0 && !im.busy ? `<span class="cover">Обложка</span>` : ""}
        ${im.busy ? "" : `<button type="button" data-rm="${i}" aria-label="Удалить фото">${icon.close}</button>`}
      </div>`
    )
    .join("");
}
async function addFiles(files) {
  const list = [...files].filter(isImageFile);
  if (!list.length) return;
  const slots = list.map(() => ({ busy: true }));
  imgs.push(...slots);
  renderImgs();
  await Promise.all(
    list.map(async (f, k) => {
      try {
        Object.assign(slots[k], await processFile(f), { busy: false });
      } catch {
        imgs.splice(imgs.indexOf(slots[k]), 1);
        toast(`Не удалось обработать ${f.name}`, "error");
      }
      renderImgs();
    })
  );
}
$("#files").addEventListener("change", (e) => {
  addFiles(e.target.files);
  e.target.value = "";
});
const drop = $("#drop");
["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    drop.classList.add("over");
  })
);
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("over")));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});
document.addEventListener("paste", (e) => ed.open && addFiles(e.clipboardData.files));

// reorder + remove
let dragI = null;
const tiles = $("#imgs");
tiles.addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (!b) return;
  imgs.splice(+b.dataset.rm, 1);
  renderImgs();
});
tiles.addEventListener("dragstart", (e) => {
  const t = e.target.closest(".img-tile");
  dragI = +t.dataset.i;
  t.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
});
tiles.addEventListener("dragover", (e) => {
  if (dragI == null) return;
  e.preventDefault();
  $$(".img-tile", tiles).forEach((t) => t.classList.toggle("over", t === e.target.closest(".img-tile")));
});
tiles.addEventListener("drop", (e) => {
  const t = e.target.closest(".img-tile");
  if (dragI == null || !t) return;
  e.preventDefault();
  const [m] = imgs.splice(dragI, 1);
  imgs.splice(+t.dataset.i, 0, m);
  dragI = null;
  renderImgs();
});
tiles.addEventListener("dragend", () => {
  dragI = null;
  renderImgs();
});

async function openEditor(p = null) {
  editing = p;
  $("#edTitle").textContent = p ? "Редактировать" : "Новый товар";
  $("#edForm").reset();
  $("#edErr").textContent = "";
  $("#brandList").innerHTML = [...new Set(products.map((x) => x.brand))].map((b) => `<option value="${esc(b)}">`).join("");
  sizes = new Set(p?.sizes || []);
  renderSubs();
  renderSizes();
  imgs = [];
  if (p) {
    EF.brand.value = p.brand;
    EF.pname.value = p.name;
    EF.cat.value = p.cat;
    renderSubs(p.sub || "");
    renderSizes();
    EF.price.value = p.price;
    EF.oldPrice.value = p.oldPrice || "";
    EF.desc.value = p.desc || "";
    EF.featured.checked = !!p.featured;
    EF.published.checked = !!p.published;
    if (p.imgCount) {
      imgs = Array.from({ length: p.imgCount }, () => ({ busy: true }));
      renderImgs();
      const full = await api.products.images(p.id).catch(() => []);
      imgs = full.map((f, i) => ({ full: f, thumb: i < 2 ? p.thumbs?.[i] : null }));
    }
  }
  renderImgs();
  if (!ed.open) ed.showModal();
}
ed.addEventListener("click", (e) => {
  if (e.target === ed || e.target.closest("[data-close]")) ed.close();
});

$("#edForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const bad = [];
  if (!EF.brand.value.trim()) bad.push(EF.brand);
  if (!EF.pname.value.trim()) bad.push(EF.pname);
  if (!(+EF.price.value > 0)) bad.push(EF.price);
  $$("[aria-invalid]", ed).forEach((i) => i.removeAttribute("aria-invalid"));
  if (bad.length || !sizes.size) {
    bad.forEach((i) => i.setAttribute("aria-invalid", "true"));
    $("#edErr").textContent = !sizes.size && !bad.length ? "Выберите хотя бы один размер" : "Заполните бренд, название и цену";
    bad[0]?.focus();
    return;
  }
  if (imgs.some((i) => i.busy)) return ($("#edErr").textContent = "Дождитесь обработки фото");

  const btn = $("#edSave");
  btn.classList.add("loading");
  try {
    for (const [i, im] of imgs.entries()) if (i < 2 && !im.thumb) im.thumb = await compress(im.full, 560, 0.72);
    const data = {
      ...(editing || {}),
      brand: EF.brand.value.trim(),
      name: EF.pname.value.trim(),
      cat: EF.cat.value,
      sub: EF.sub.value,
      price: Math.round(+EF.price.value),
      oldPrice: Math.round(+EF.oldPrice.value) || 0,
      stock: "stock",
      sizes: [...sizes],
      desc: EF.desc.value.trim(),
      featured: EF.featured.checked,
      published: EF.published.checked,
    };
    if (!editing) {
      data.thumbs = [];
      data.imgCount = 0;
    }
    await api.products.save(data, imgs.map(({ full, thumb }) => ({ full, thumb })));
    await load();
    ed.close();
    toast(editing ? "Изменения сохранены" : "Товар добавлен");
    S.tab = "products";
    shell();
  } catch (err) {
    $("#edErr").textContent = errorText(err);
  }
  btn.classList.remove("loading");
});

/* ---------------- guard ---------------- */
let started = false;
api.auth.onChange(async (u) => {
  if (!u?.isAdmin) {
    started = false;
    view.innerHTML = `<div class="guard"><div class="empty-state">
      <div class="empty-orb">${icon.shield}</div>
      <p>${u ? "У этого аккаунта нет доступа к админ-панели" : "Войдите как администратор"}</p>
      <a class="btn btn-chrome" href="account.html?next=admin.html">${u ? "Сменить аккаунт" : "Войти"}</a></div></div>`;
    return;
  }
  if (started) return;
  started = true;
  view.innerHTML = `<div class="page-head"><div class="sk sk-line" style="height:80px;width:50%"></div></div>`;
  await load();
  S.tab = ["overview", "products", "orders", "requests"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
  shell();
});
