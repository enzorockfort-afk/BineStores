import { esc, money, art, fmtDate, STATUS } from "./ui.js?v=18";
import { ORDER_STATUSES, REQUEST_STATUSES } from "./config.js?v=18";
import { pickupPoint } from "./pickup.js?v=18";
import { lang } from "./i18n.js?v=18";

/* Telegram клиента: @username ссылкой или текст «как найти» */
export const tgContact = (c = {}) =>
  c.telegram ? `<a href="https://t.me/${esc(c.telegram)}" target="_blank" rel="noopener">@${esc(c.telegram)}</a>` : esc(c.tgNote || "—");
export function deliveryText(d) {
  if (d?.type !== "ship") return "Встреча в Кишинёве";
  if (d.method === "bus") return `Маршрутка: ${d.city}`;
  if (d.method === "post") return `Почта: ${d.city}, ${d.address}`;
  return `Доставка: ${d.city}, ${d.address}`;
}

function trackHtml(st) {
  if (st === "cancelled") return "";
  const map = { new: 0, confirmed: 1, prepaid: 1, ordered: 1, transit: 2, shipping: 2, arrived: 2, ready: 2, done: 3 };
  const at = map[st] ?? 0;
  const labels = ["Принят", "Подтверждён", "В пути", "Получен"];
  return `<div class="track">${labels.map((l, i) => `<span class="${i <= at ? "on" : ""}">${l}</span>`).join("")}</div>`;
}

/* admin=true adds contact info and a status selector */
export function orderHtml(o, i, admin = false) {
  const status = admin
    ? `<select class="select" data-status="${esc(o.id)}" aria-label="Статус заказа">${Object.entries(ORDER_STATUSES)
        .map(([k, t]) => `<option value="${k}"${k === o.status ? " selected" : ""}>${t}</option>`)
        .join("")}</select>`
    : "";
  return `<details class="order" style="--i:${i}">
    <summary>
      <span><span class="order-num">${esc(o.number)}</span><span class="order-date">${fmtDate(o.createdAt)}${admin ? ` · ${esc(o.contact?.name)}` : ""}</span></span>
      <span class="order-sum${admin ? " hide-m" : ""}">${money(o.total)}</span>
      <span class="st st-${o.status}">${ORDER_STATUSES[o.status] || o.status}</span>
      ${admin ? `<span class="hide-m">${status}</span>` : ""}
    </summary>
    <div class="order-body">
      ${admin ? `<div style="margin-top:16px">${status}</div>` : trackHtml(o.status)}
      <ul class="line-items">${o.items
        .map(
          (it) => `<li class="line"><a class="line-pic" href="product.html?id=${encodeURIComponent(it.id)}">${it.thumb ? `<img src="${it.thumb}" alt="${esc(it.brand + " " + it.name)}">` : art(it, "art-sm")}</a>
          <div class="line-info"><b>${esc(it.brand)}</b><span>${esc(it.name)}</span><small>Размер ${esc(it.size)} × ${it.qty} · ${STATUS[it.stock] || ""}</small></div>
          <span class="line-sum">${money(it.price * it.qty)}</span></li>`
        )
        .join("")}</ul>
      <dl class="kv">
        ${admin ? `<dt>Клиент</dt><dd>${esc(o.contact?.name)}, <a href="tel:${esc(o.contact?.phone)}">${esc(o.contact?.phone)}</a></dd><dt>Telegram</dt><dd>${tgContact(o.contact)}</dd><dt>Аккаунт</dt><dd>${o.uid ? "Да" : "Гость"}</dd>` : ""}
        <dt>Получение</dt><dd>${esc(deliveryText(o.delivery))}</dd>
        ${o.delivery?.method === "bus" ? `<dt>Где забрать</dt><dd data-no-i18n>${esc(pickupPoint(o.delivery.city, lang))}</dd>` : ""}
        ${o.comment ? `<dt>Комментарий</dt><dd>${esc(o.comment)}</dd>` : ""}
        ${admin ? `<dt>Итого</dt><dd><b>${money(o.total)}</b></dd>` : ""}
      </dl>
    </div>
  </details>`;
}

/* Заявка «под заказ»: admin=true добавляет контакты, кнопки связи и выбор статуса */
export function requestHtml(r, i, admin = false) {
  const digits = (r.contact?.phone || "").replace(/\D/g, "");
  const status = admin
    ? `<select class="select" data-rstatus="${esc(r.id)}" aria-label="Статус заявки">${Object.entries(REQUEST_STATUSES)
        .map(([k, t]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${t}</option>`)
        .join("")}</select>`
    : "";
  const via = { telegram: "Telegram", whatsapp: "WhatsApp", viber: "Viber", phone: "Звонок" }[r.contact?.via] || "—";
  const link = /^https?:\/\//i.test(r.link || "") ? `<a href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${esc(r.link)}</a>` : esc(r.link || "");
  return `<details class="order" style="--i:${i}">
    <summary>
      <span><span class="order-num">${esc(r.number)}</span><span class="order-date">${fmtDate(r.createdAt)} · ${esc(r.title)}</span></span>
      <span class="order-sum hide-m">${r.photos?.length ? `${r.photos.length} фото` : ""}</span>
      <span class="st st-${r.status}">${REQUEST_STATUSES[r.status] || r.status}</span>
    </summary>
    <div class="order-body">
      ${admin ? `<div class="req-acts">${status}
        ${digits ? `<a class="btn btn-ghost btn-sm" href="tel:+${digits}">Позвонить</a>
        <a class="btn btn-ghost btn-sm" href="https://wa.me/${digits}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn-ghost btn-sm" href="viber://chat?number=%2B${digits}">Viber</a>` : ""}</div>` : ""}
      ${r.photos?.length ? `<div class="req-photos">${r.photos.map((p, k) => `<button type="button" data-zoom="${k}" aria-label="Открыть фото ${k + 1}"><img src="${p}" alt="Фото к заявке ${esc(r.number)}, ${k + 1}"></button>`).join("")}</div>` : ""}
      <dl class="kv">
        <dt>Вещь</dt><dd>${esc(r.title)}</dd>
        ${r.link ? `<dt>Ссылка</dt><dd class="break">${link}</dd>` : ""}
        ${r.size ? `<dt>Размер</dt><dd>${esc(r.size)}</dd>` : ""}
        ${r.color ? `<dt>Цвет</dt><dd>${esc(r.color)}</dd>` : ""}
        <dt>Количество</dt><dd>${r.qty || 1}</dd>
        ${r.budget ? `<dt>Бюджет</dt><dd>до ${money(r.budget)}</dd>` : ""}
        ${r.comment ? `<dt>Комментарий</dt><dd>${esc(r.comment)}</dd>` : ""}
        ${admin ? `<dt>Клиент</dt><dd>${esc(r.contact?.name)}, <a href="tel:+${digits}">${esc(r.contact?.phone)}</a></dd><dt>Связь</dt><dd>${r.contact?.telegram || r.contact?.tgNote ? tgContact(r.contact) : via}</dd><dt>Аккаунт</dt><dd>${r.uid ? "Да" : "Гость"}</dd>` : ""}
      </dl>
    </div>
  </details>`;
}
