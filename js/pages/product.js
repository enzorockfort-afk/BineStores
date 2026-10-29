import { initLayout, $, $$, card, reveal, esc, qs, icon, art, tag, priceHtml, money, toast, flyToCart, burst, loadProducts, reduced, lang, sizesInStock, otherSizes, orderLink } from "../ui.js?v=17";
import { api } from "../api.js?v=17";
import { SHOP } from "../config.js?v=17";
import { cart, favs } from "../store.js?v=17";

await initLayout("catalog");

const root = $("#pd");
const id = qs("id");
root.innerHTML = `<div class="pd"><div class="g-main sk"></div><div class="pd-info"><div class="sk sk-line"></div><div class="sk sk-line short"></div></div></div>`;
const p = id ? await api.products.get(id) : null;

if (!p) {
  root.innerHTML = `<div class="empty-state" style="padding:120px 0">
    <div class="empty-orb">${icon.search}</div><p>Товар не найден или снят с продажи</p>
    <a class="btn btn-ghost" href="catalog.html">Вернуться в каталог</a></div>`;
} else {
  document.title = `${p.brand} ${p.name} — Bine Store`;
  $('meta[name="description"]').content = `${p.brand} ${p.name} — ${money(p.price)}. ${p.stock === "stock" ? "В наличии в Кишинёве" : "Под заказ из Китая"}.`;
  $("#crumbs").insertAdjacentHTML("beforeend", `<a href="catalog.html?cat=${encodeURIComponent(p.cat)}"><span>${esc(p.cat)}</span></a>${p.sub ? `<a href="catalog.html?cat=${encodeURIComponent(p.cat)}&sub=${encodeURIComponent(p.sub)}"><span>${esc(p.sub)}</span></a>` : ""}<span>${esc(p.brand)}</span>`);

  let images = p.imgCount ? await api.products.images(p.id).catch(() => []) : [];
  const slides = images.length ? images.map((src) => `<img src="${src}" alt="${esc(p.brand + " " + p.name)}">`) : [art(p)];
  const thumbs = images.length ? images.map((src) => `<img src="${src}" alt="">`) : [art(p, "art-sm")];
  // остатки ведутся в CRM: размер с нулём недоступен
  const avail = sizesInStock(p);
  const more = otherSizes(p);
  const single = avail.length === 1;
  const askText = encodeURIComponent(
    lang === "ro" ? `Bună ziua! Mă interesează ${p.brand} ${p.name} (${location.href})` : `Здравствуйте! Интересует ${p.brand} ${p.name} (${location.href})`
  );

  root.innerHTML = `
  <div class="pd">
    <div class="gallery">
      <div class="g-thumbs" role="tablist" aria-label="Фото">${thumbs
        .map((t, i) => `<button class="g-thumb" role="tab" data-go="${i}" aria-current="${i === 0}" aria-label="Фото ${i + 1}">${t}</button>`)
        .join("")}</div>
      <div class="g-main" id="gMain">
        ${slides.map((s, i) => `<div class="g-slide${i === 0 ? " on" : ""}">${s}</div>`).join("")}
        ${slides.length > 1 ? `<div class="g-arrows"><button data-step="-1" aria-label="Предыдущее фото">${icon.back}</button><button data-step="1" aria-label="Следующее фото">${icon.arrow}</button></div>
        <span class="g-count" id="gCount">1 / ${slides.length}</span>
        <div class="g-dots">${slides.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>` : ""}
      </div>
    </div>

    <div class="pd-info">
      <div>
        <a class="pd-brand" href="catalog.html?brand=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a>
        <h1 class="pd-name">${esc(p.name)}</h1>
      </div>
      <div class="pd-tags">${tag(p.stock)}<small>${p.stock === "stock" ? "Готово к выдаче в Кишинёве" : `Срок доставки ${SHOP.chinaDays}`}</small></div>
      <div class="pd-price">${priceHtml(p)}</div>
      <div>
        <div class="pd-label"><span>Размер</span><em id="sizeErr">Выберите размер</em></div>
        <div class="sizes" id="sizes" role="radiogroup" aria-label="Размер">${avail
          .map((s) => `<button class="size" role="radio" aria-checked="${single}" data-size="${esc(s)}">${esc(s)}</button>`)
          .join("")}${more
          .map((s) => `<a class="size size-order" href="${orderLink(p, s)}" aria-label="${esc(s)} — под заказ">${esc(s)}<small>под заказ</small></a>`)
          .join("")}</div>
      </div>
      <div class="pd-actions">
        <button class="btn btn-chrome" id="addBtn" data-magnetic>${icon.bag} Добавить в корзину</button>
        <button class="fav-btn" data-fav="${esc(p.id)}" aria-pressed="${favs.has(p.id)}" aria-label="В избранное">${icon.heart}</button>
      </div>
      ${SHOP.telegram ? `<a class="pd-ask" href="https://t.me/${SHOP.telegram}?text=${askText}" target="_blank" rel="noopener">${icon.tg} Задать вопрос менеджеру</a>` : ""}
      <div class="pd-perks">
        <div>${icon.shield} Осматриваем и упаковываем вещь перед выдачей</div>
        <div>${icon.pin} Личная встреча в Кишинёве</div>
        <div>${icon.truck} Доставка по Молдове 1–2 дня</div>
      </div>
      <div class="acc">
        ${p.desc ? `<details open><summary>Описание</summary><div class="acc-body">${esc(p.desc)}</div></details>` : ""}
        <details><summary>Доставка</summary><div class="acc-body">Встреча в Кишинёве.
Доставка по Молдове почтой или маршруткой, 1–2 дня.
При доставке в другой город или село сначала оплачивается вся сумма на карту, затем отправляем заказ почтой или маршруткой.
${p.stock === "china" ? `Заказ из Китая — ${SHOP.chinaDays}. Перед отправкой присылаем фото вещи.` : ""}</div></details>
        <details><summary>Оплата</summary><div class="acc-body">Личная встреча — наличными всю сумму.
Для заказов из Китая — предоплата 50% на карту, остаток при получении.
При доставке в другой город или село сначала оплачивается вся сумма на карту, затем отправляем заказ почтой или маршруткой.</div></details>
      </div>
    </div>
  </div>
  <div class="mobile-buy" id="mobileBuy"><span class="price-now">${money(p.price)}</span><button class="btn btn-chrome" id="addBtn2">Добавить в корзину</button></div>`;

  // gallery
  const gMain = $("#gMain");
  let cur = 0;
  const go = (i) => {
    const n = slides.length;
    cur = (i + n) % n;
    $$(".g-slide", gMain).forEach((s, k) => s.classList.toggle("on", k === cur));
    $$(".g-thumb").forEach((t, k) => t.setAttribute("aria-current", k === cur));
    $$(".g-dots i").forEach((t, k) => t.classList.toggle("on", k === cur));
    if ($("#gCount")) $("#gCount").textContent = `${cur + 1} / ${n}`;
    gMain.classList.remove("zoom");
  };
  $(".g-thumbs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) go(+b.dataset.go);
  });
  gMain.addEventListener("click", (e) => {
    const s = e.target.closest("[data-step]");
    if (s) return go(cur + +s.dataset.step);
    if (e.target.tagName === "IMG" && matchMedia("(pointer:fine)").matches) gMain.classList.toggle("zoom");
  });
  gMain.addEventListener("pointermove", (e) => {
    const r = gMain.getBoundingClientRect();
    gMain.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
    gMain.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
  gMain.addEventListener("pointerleave", () => gMain.classList.remove("zoom"));
  let sx = null;
  gMain.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  gMain.addEventListener("touchend", (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });
  addEventListener("keydown", (e) => {
    if (e.target.closest("input,textarea")) return;
    if (e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowLeft") go(cur - 1);
  });

  // sizes + add
  let size = single ? avail[0] : null;
  $("#sizes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if (!b) return;
    size = b.dataset.size;
    $$("#sizes .size").forEach((s) => s.setAttribute("aria-checked", s === b));
    $("#sizeErr").classList.remove("show");
    $("#sizes").classList.remove("err");
  });
  const add = (btn) => {
    if (!size) {
      $("#sizeErr").classList.add("show");
      const s = $("#sizes");
      s.classList.remove("err");
      void s.offsetWidth;
      s.classList.add("err");
      s.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      return;
    }
    cart.add(p, size);
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    flyToCart($(".g-slide.on", gMain));
    toast(`Добавлено: ${p.brand}, размер ${size}`);
  };
  $("#addBtn").addEventListener("click", (e) => add(e.currentTarget));
  $("#addBtn2").addEventListener("click", (e) => add(e.currentTarget));

  // sticky mobile buy bar when main button is out of view
  const mb = $("#mobileBuy");
  new IntersectionObserver(([e]) => mb.classList.toggle("show", !e.isIntersecting && e.boundingClientRect.top < 0)).observe($("#addBtn"));

  // related
  const list = await loadProducts();
  const rel = list
    .filter((x) => x.id !== p.id)
    .map((x) => ({ x, s: (x.cat === p.cat) * 2 + (x.brand === p.brand) * 3 + (x.stock === p.stock) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((r) => r.x);
  if (rel.length) {
    $("#related").hidden = false;
    $("#relGrid").innerHTML = rel.map(card).join("");
  }
  reveal();
}
