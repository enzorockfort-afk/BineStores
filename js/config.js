/* =========================================================
   НАСТРОЙКИ МАГАЗИНА
   ========================================================= */
export const SHOP = {
  name: "Bine Store",
  city: "Кишинёв",
  telegram: "bine_manager",    // менеджер в Telegram (username без @) — сюда идут вопросы и заказы
  channel: "bine_store",       // Telegram-канал
  tiktok: "binestoremds",      // TikTok (без @)
  instagram: "binestoremd",    // Instagram (без @)
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
  apiKey: "AIzaSyBeT-5IXv4cynmLtECavfDY0okViKD6wLM",
  authDomain: "binecrm.firebaseapp.com",
  projectId: "binecrm",
  storageBucket: "binecrm.firebasestorage.app",
  messagingSenderId: "103777865626",
  appId: "1:103777865626:web:00a247429751b92383f423",
};

/* Демо-режим: аккаунт администратора, который создаётся в браузере
   автоматически. В режиме Firebase не используется. */
export const DEMO_ADMIN = {
  email: "admin@binestore.md",
  password: "BineAdmin2026",
  name: "Администратор",
};

/* Вход в CRM (crm.html): вводится только пароль — CRM входит в аккаунт CRM_EMAIL
   (Firebase Authentication). Сам пароль в коде не хранится. */
export const CRM_EMAIL = "babaevdavid88@gmail.com";

export const CATEGORIES = ["Обувь", "Одежда", "Аксессуары", "Сумки"];

/* Подкатегории: выбираются в админке, по ним фильтруется каталог */
export const SUBCATEGORIES = {
  Обувь: ["Кроссовки", "Кеды", "Ботинки", "Туфли и лоферы", "Сандалии и шлёпанцы"],
  Одежда: [
    "Футболки", "Лонгсливы", "Худи и свитшоты", "Свитеры и кардиганы", "Рубашки",
    "Куртки", "Пуховики", "Жилеты", "Пальто", "Джинсы", "Брюки", "Спортивные штаны",
    "Шорты", "Спортивные костюмы", "Платья и юбки", "Нижнее бельё и носки",
  ],
  Аксессуары: ["Кепки и панамы", "Шапки", "Ремни", "Очки", "Украшения", "Часы", "Шарфы и перчатки"],
  Сумки: ["Через плечо", "Рюкзаки", "Поясные", "Шопперы", "Кошельки и картхолдеры"],
};

/* Наборы размеров для быстрого выбора в админке */
const range = (a, b, pre = "") => Array.from({ length: b - a + 1 }, (_, i) => pre + (a + i));
export const SIZE_SETS = {
  shoes: range(30, 48),
  clothes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  waist: range(24, 36, "W").concat(["W38", "W40"]),
  one: ["One size"],
};
/* подкатегории низа: к буквенным размерам добавляются размеры по талии */
export const WAIST_SUBS = ["Джинсы", "Брюки", "Спортивные штаны", "Шорты"];
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
