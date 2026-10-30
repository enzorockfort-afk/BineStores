import { initLayout, $, $$, esc, money, art, icon, toast, burst, STATUS, socials, lang } from "../ui.js?v=18";
import { CITIES, BUS_PRICE, POST_PRICE, pickupPoint } from "../pickup.js?v=18";
import { api, errorText } from "../api.js?v=18";
import { SHOP } from "../config.js?v=18";
import { cart, onStoreChange } from "../store.js?v=18";

const user = await initLayout("");
const form = $("#form");
const F = form.elements;

$("#mdCities").innerHTML = CITIES.map(([ru, ro]) => `<option value="${lang === "ro" ? ro : ru}">`).join("");
/* username, если клиент указал именно его; иначе — текст «как найти» */
const tgUser = (s) => {
  const u = s.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  return /^[A-Za-z0-9_]{4,32}$/.test(u) ? u : "";
};

function renderSummary() {
  if (!$("#lines")) return;
  const items = cart.items();
  if (!items.length && $("#doneView").hidden) {
    $("#co").innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-orb">${icon.bag}</div><p>Корзина пуста</p><a class="btn btn-chrome" href="catalog.html">Перейти в каталог</a></div>`;
    return;
  }
  $("#lines").innerHTML = items
    .map(
      (it) => `<li class="line"><span class="line-pic">${it.thumb ? `<img src="${it.thumb}" alt="${esc(it.brand + " " + it.name)}">` : art(it, "art-sm")}</span>
      <div class="line-info"><b>${esc(it.brand)}</b><span>${esc(it.name)}</span><small>Размер ${esc(it.size)} × ${it.qty} · ${STATUS[it.stock]}</small></div>
      <span class="line-sum">${money(it.price * it.qty)}</span></li>`
    )
    .join("");
  $("#subtotal").textContent = money(cart.total());
  delivery();
}

/* стоимость и пункт получения зависят от способа доставки */
function delivery() {
  const ship = F.delivery.value === "ship";
  const bus = F.shipBy.value === "bus";
  $("#shipFields").hidden = !ship;
  $("#postField").hidden = !ship || bus;
  const where = ship && bus ? pickupPoint(F.city.value, lang) : "";
  $("#pickup").hidden = !where;
  $("#pickup").textContent = where;
  const cost = ship ? (bus ? BUS_PRICE : POST_PRICE) : 0;
  const approx = ship && !bus ? "≈" : "";
  $("#delivCost").textContent = cost ? approx + money(cost) : "Бесплатно";
  $("#total").textContent = approx + money(cart.total() + cost);
  $("#payNote").textContent = ship ? "Сначала оплата всей суммы на карту, затем отправка" : "Оплата при получении";
}
renderSummary();
onStoreChange(renderSummary);

// prefill from profile
$("#signinHint").hidden = !!user;
if (user) {
  const prof = (await api.profile.get().catch(() => null)) || {};
  F.name.value = prof.name || user.name || "";
  F.phone.value = prof.phone || "";
  F.city.value = prof.city || "";
  F.address.value = prof.address || "";
  F.telegram.value = prof.telegram || "";
}

form.addEventListener("change", (e) => ["delivery", "shipBy"].includes(e.target.name) && delivery());
F.city.addEventListener("input", delivery);
F.phone.addEventListener("focus", () => !F.phone.value && (F.phone.value = "+373 "));
form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));

const msgText = (o) =>
  [
    lang === "ro" ? `Comanda ${o.number} — Bine Store` : `Заказ ${o.number} — Bine Store`,
    "",
    ...o.items.map((i, n) => `${n + 1}. ${i.brand} ${i.name}, ${lang === "ro" ? "mărimea" : "р."} ${i.size} × ${i.qty} = ${money(i.price * i.qty)}`),
    "",
    `${lang === "ro" ? "Total" : "Итого"}: ${money(o.total)}`,
    `${lang === "ro" ? "Nume" : "Имя"}: ${o.contact.name}, ${o.contact.phone}`,
    o.delivery.type === "ship"
      ? o.delivery.method === "bus"
        ? `${lang === "ro" ? "Microbuz" : "Маршрутка"}: ${o.delivery.city}`
        : `${lang === "ro" ? "Poștă" : "Почта"}: ${o.delivery.city}, ${o.delivery.address}`
      : lang === "ro" ? "Întâlnire în Chișinău" : "Встреча в Кишинёве",
    `Telegram: ${o.contact.telegram ? "@" + o.contact.telegram : o.contact.tgNote}`,
  ]
    .filter((x, i, a) => x || a[i - 1])
    .join("\n");

function messengerUrl(m, text) {
  const t = encodeURIComponent(text);
  return `https://t.me/${SHOP.telegram}?text=${t}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
  const bad = [];
  if (d.name.length < 2) bad.push("name");
  if (d.phone.replace(/\D/g, "").length < 8) bad.push("phone");
  if (d.delivery === "ship") {
    if (!d.city) bad.push("city");
    if (d.shipBy === "post" && !d.address) bad.push("address");
  }
  if (d.telegram.length < 3) bad.push("telegram");
  if (bad.length) {
    bad.forEach((n) => F[n].setAttribute("aria-invalid", "true"));
    F[bad[0]].focus();
    $("#err").textContent = "Заполните отмеченные поля";
    return;
  }
  if (!F.agree.checked) {
    F.agree.focus();
    $("#err").textContent = "Подтвердите согласие с условиями, чтобы оформить заказ";
    return;
  }
  $("#err").textContent = "";
  const btn = $("#submit");
  btn.classList.add("loading");

  const items = cart.items().map(({ id, brand, name, size, qty, price, stock, thumb }) => ({ id, brand, name, size, qty, price, stock, thumb }));
  const order = {
    number: "BS-" + Date.now().toString(36).slice(-6).toUpperCase(),
    items,
    total: cart.total(),
    contact: { name: d.name, phone: d.phone, telegram: tgUser(d.telegram), tgNote: tgUser(d.telegram) ? "" : d.telegram },
    delivery:
      d.delivery === "ship"
        ? d.shipBy === "bus"
          ? { type: "ship", method: "bus", city: d.city, address: "", pickup: pickupPoint(d.city), cost: BUS_PRICE }
          : { type: "ship", method: "post", city: d.city, address: d.address, cost: POST_PRICE }
        : { type: "meet", city: "", address: "" },
    messenger: "telegram",
    comment: "",
    consentAt: Date.now(),
  };
  try {
    const saved = await api.orders.create(order);
    if (user) api.profile.save({ name: d.name, phone: d.phone, city: d.city, address: d.address, telegram: d.telegram }).catch(() => {});
    cart.clear();
    showDone(saved);
  } catch (err) {
    btn.classList.remove("loading");
    toast(errorText(err), "error");
  }
});

function showDone(o) {
  const text = msgText(o);
  $("#checkoutView").hidden = true;
  const v = $("#doneView");
  v.hidden = false;
  v.innerHTML = `<section class="success">
    <div class="success-orb">${icon.check}</div>
    <h1 class="chrome-t">Заказ принят</h1>
    <span class="num">${esc(o.number)}</span>
    <p>Мы свяжемся с вами в ближайшее время.</p>
    ${SHOP.telegram ? `<a class="btn btn-chrome" href="${messengerUrl(o.messenger, text)}" target="_blank" rel="noopener" data-magnetic>${icon.tg} Написать менеджеру в Telegram</a>` : ""}
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      ${user ? `<a class="btn btn-ghost" href="account.html#orders">Мои заказы</a>` : ""}
      <a class="btn btn-ghost" href="catalog.html">Продолжить покупки</a>
    </div>
  </section>`;
  scrollTo(0, 0);
  navigator.clipboard?.writeText(text).catch(() => {});
  const r = $(".success-orb").getBoundingClientRect();
  setTimeout(() => burst(r.left + r.width / 2, r.top + r.height / 2, 18), 500);
}
