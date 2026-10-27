/* =========================================================
   НАСТРОЙКИ МАГАЗИНА
   ========================================================= */
export const SHOP = {
  name: "Bine Store",
  city: "Кишинёв",
  telegram: "binestore",       // username без @
  whatsapp: "37360000000",     // номер без + и пробелов
  viber: "37360000000",        // номер без + и пробелов
  instagram: "binestore",      // username без @
  currency: "лей",
  chinaDays: "14–20 дней",
};

/* =========================================================
   РЕКВИЗИТЫ — обязательно заполните перед публикацией.
   Показываются в подвале и в юридических документах.
   ========================================================= */
export const COMPANY = {
  name: "",        // например: ÎI «Ivanov Ivan» или SRL «Bine Store»
  idno: "",        // IDNO / фискальный код
  address: "",     // юридический адрес
  email: "",       // email для заявлений (возврат, удаление данных)
  phone: "",       // телефон
};
export const LEGAL_UPDATED = "26 октября 2026";

/* =========================================================
   FIREBASE
   Вставьте сюда конфиг из Firebase Console → Project settings → Your apps.
   Пока apiKey пустой — сайт работает в ДЕМО-режиме:
   данные хранятся только в этом браузере.
   ========================================================= */
export const FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/* Демо-режим: аккаунт администратора, который создаётся в браузере
   автоматически. В режиме Firebase не используется. */
export const DEMO_ADMIN = {
  email: "admin@binestore.md",
  password: "BineAdmin2026",
  name: "Администратор",
};

export const CATEGORIES = ["Обувь", "Одежда", "Аксессуары", "Сумки"];
export const REQUEST_STATUSES = {
  new: "Новая",
  progress: "Ищем",
  offered: "Предложение",
  prepaid: "Предоплата",
  ordered: "Выкуплено",
  transit: "В пути",
  arrived: "Приехало",
  done: "Выдано",
  cancelled: "Отменена",
};
export const SOURCES = { site: "Сайт", instagram: "Instagram", telegram: "Telegram", whatsapp: "WhatsApp", viber: "Viber", offline: "Лично", other: "Другое" };
export const ORDER_STATUSES = {
  new: "Новый",
  confirmed: "Подтверждён",
  ordered: "Заказан в Китае",
  shipping: "В пути",
  ready: "Готов к выдаче",
  done: "Выполнен",
  cancelled: "Отменён",
};
