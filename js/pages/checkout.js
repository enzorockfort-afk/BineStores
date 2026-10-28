import { initLayout, $, $$, esc, money, art, icon, toast, burst, STATUS, socials, lang } from "../ui.js";
import { api, errorText } from "../api.js";
import { SHOP } from "../config.js";
import { cart, onStoreChange } from "../store.js";

const user = await initLayout("");
const form = $("#form");
const F = form.elements;

const MESS = [
  ["telegram", "Telegram", icon.tg],
  ["phone", "Звонок", '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>'],
].filter(([k]) => k === "phone" || SHOP[k]);
$("#messengers").style.gridTemplateColumns = `repeat(${MESS.length}, 1fr)`;
$("#messengers").innerHTML = MESS.map(
  ([k, t, i], n) => `<label class="opt"><input type="radio" name="messenger" value="${k}"${n ? "" : " checked"}><span class="opt-body">${i}<b>${t}</b></span></label>`
).join("");

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
  $("#total").textContent = money(cart.total());
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
}

form.addEventListener("change", (e) => {
  if (e.target.name === "delivery") {
    const ship = e.target.value === "ship";
    $("#shipFields").hidden = !ship;
    $("#delivCost").textContent = ship ? "По тарифу службы" : "Бесплатно";
  }
});
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
    o.delivery.type === "ship" ? `${lang === "ro" ? "Livrare" : "Доставка"}: ${o.delivery.city}, ${o.delivery.address}` : lang === "ro" ? "Întâlnire în Chișinău" : "Встреча в Кишинёве",
    o.comment ? `${lang === "ro" ? "Comentariu" : "Комментарий"}: ${o.comment}` : "",
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
    if (!d.address) bad.push("address");
  }
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
    contact: { name: d.name, phone: d.phone },
    delivery: { type: d.delivery, city: d.city || "", address: d.address || "" },
    messenger: d.messenger || "",
    comment: d.comment || "",
    consentAt: Date.now(),
  };
  try {
    const saved = await api.orders.create(order);
    if (user) api.profile.save({ name: d.name, phone: d.phone, city: d.city, address: d.address }).catch(() => {});
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
    <p>Мы свяжемся с вами в ближайшее время. Чтобы ускорить подтверждение — отправьте заказ нам в мессенджер.</p>
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
