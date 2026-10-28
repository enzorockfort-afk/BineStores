/* =========================================================
   Два языка: русский (исходный) и румынский.
   Тексты сайта написаны по-русски; при выборе RO страница переводится
   на лету по словарю ниже — включая то, что появляется позже
   (корзина, уведомления, формы). Админка и CRM остаются на русском.
   ========================================================= */
const KEY = "bs-lang";
export const I18N_ON = !/\/(admin|crm)\.html$/i.test(location.pathname);

function detect() {
  if (!I18N_ON) return "ru";
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "ru" || q === "ro") {
      localStorage.setItem(KEY, q);
      return q;
    }
    const s = localStorage.getItem(KEY);
    if (s === "ru" || s === "ro") return s;
  } catch {}
  return (navigator.language || "").toLowerCase().startsWith("ro") ? "ro" : "ru";
}
export const lang = detect();
export const locale = lang === "ro" ? "ro-RO" : "ru-RU";
export function setLang(l) {
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  const u = new URL(location.href);
  u.searchParams.delete("lang");
  location.replace(u.href);
}

/* ---------------- словарь RU → RO ---------------- */
const DICT = {
  // общее, навигация
  "Главная": "Acasă",
  "Каталог": "Catalog",
  "Под заказ": "La comandă",
  "Доставка": "Livrare",
  "Избранное": "Favorite",
  "Личный кабинет": "Contul meu",
  "Корзина": "Coș",
  "Поиск": "Căutare",
  "Меню": "Meniu",
  "Закрыть": "Închide",
  "Закрыть поиск": "Închide căutarea",
  "Закрыть корзину": "Închide coșul",
  "Поиск товаров": "Căutare produse",
  "Найти": "Caută",
  "Nike, Jordan, худи…": "Nike, Jordan, hanorac…",
  "Основная навигация": "Navigare principală",
  "Bine Store — главная": "Bine Store — acasă",
  "Навигация": "Navigare",
  "Перейти к содержимому": "Treci la conținut",
  "Пропустить": "Sari peste",
  "Войти": "Intră",
  "Меньше": "Mai puțin",
  "Больше": "Mai mult",
  "Назад": "Înapoi",
  "Вперёд": "Înainte",
  "Все": "Toate",
  "Да": "Da",
  "Гость": "Oaspete",
  "Готово": "Gata",
  "Данные": "Date",

  // подвал, соцсети, cookie
  "Магазин": "Magazin",
  "Скидки": "Reduceri",
  "Под заказ из Китая": "La comandă din China",
  "Покупателям": "Pentru clienți",
  "Доставка и оплата": "Livrare și plată",
  "Как заказать": "Cum comanzi",
  "Мои заказы": "Comenzile mele",
  "Связаться": "Contacte",
  "Документы": "Documente",
  "Конфиденциальность": "Confidențialitate",
  "Условия использования": "Termeni de utilizare",
  "Возврат и обмен": "Retur și schimb",
  "Cookie": "Cookie",
  "Менеджер": "Manager",
  "Telegram-канал": "Canal Telegram",
  "Настройки cookie": "Setări cookie",
  "Наверх": "Sus",
  "Кишинёв": "Chișinău",
  "Кишинёв, Молдова": "Chișinău, Moldova",
  "Мы используем только необходимые cookie и локальное хранилище — для корзины, входа и работы сайта. Рекламных и аналитических трекеров нет.":
    "Folosim doar cookie-uri necesare și stocare locală — pentru coș, autentificare și funcționarea site-ului. Nu avem trackere de publicitate sau analiză.",
  "Подробнее": "Detalii",
  "Только необходимые": "Doar necesare",
  "Принять все": "Accept toate",
  "Файлы cookie": "Fișiere cookie",
  "Вопрос менеджеру": "Întreabă managerul",
  "Задать вопрос менеджеру в Telegram": "Întreabă managerul pe Telegram",
  "Задать вопрос менеджеру": "Întreabă managerul",
  "Здравствуйте! У меня вопрос по Bine Store": "Bună ziua! Am o întrebare despre Bine Store",

  // корзина, поиск, избранное
  "Корзина пуста": "Coșul este gol",
  "Перейти в каталог": "Mergi la catalog",
  "Итого": "Total",
  "Встреча в Кишинёве — бесплатно": "Întâlnire în Chișinău — gratuit",
  "Оформить заказ": "Plasează comanda",
  "Все результаты": "Toate rezultatele",
  "Ничего не нашлось. Напишите нам — найдём под заказ.": "Nu am găsit nimic. Scrie-ne — îl aducem la comandă.",
  "Добавлено в избранное": "Adăugat la favorite",
  "Удалено из избранного": "Eliminat din favorite",
  "В избранное": "La favorite",
  "В наличии": "În stoc",
  "Из Китая": "Din China",

  // главная
  "Bine Store — брендовые вещи в Молдове": "Bine Store — haine de brand în Moldova",
  "Брендовые вещи из наличия и под заказ из Китая. Встреча в Кишинёве или доставка по всей Молдове.":
    "Haine de brand din stoc și la comandă din China. Întâlnire în Chișinău sau livrare în toată Moldova.",
  "Брендовые вещи из наличия и под заказ из Китая. Кишинёв и вся Молдова.":
    "Haine de brand din stoc și la comandă din China. Chișinău și toată Moldova.",
  "Смотреть каталог": "Vezi catalogul",
  "Заказ из Китая": "Comandă din China",
  "Новинки": "Noutăți",
  "Весь каталог": "Tot catalogul",
  "Как купить": "Cum cumperi",
  "Забрать": "Ridică",
  "сегодня": "azi",
  "Готовые вещи в Кишинёве. Встреча и примерка или отправка за 1–2 дня.":
    "Haine gata în Chișinău. Întâlnire și probă sau expediere în 1–2 zile.",
  "Смотреть": "Vezi",
  "Под": "La",
  "заказ": "comandă",
  "Пришлите название или фото — найдём почти любую модель за 14–20 дней.":
    "Trimite numele sau o poză — găsim aproape orice model în 14–20 zile.",
  "Оставить заявку": "Lasă o cerere",
  "Категории": "Categorii",
  "Как": "Cum",
  "заказать": "comanzi",
  "Четыре шага от выбора до примерки.": "Patru pași de la alegere la probă.",
  "Выберите вещь": "Alege produsul",
  "Добавьте в корзину из каталога или оставьте заявку под заказ.": "Adaugă-l în coș din catalog sau lasă o cerere la comandă.",
  "Оформите заказ": "Plasează comanda",
  "Контакты и способ получения — меньше минуты.": "Contacte și modul de primire — sub un minut.",
  "Подтвердим": "Confirmăm",
  "Напишем в мессенджер, уточним наличие и сроки.": "Îți scriem pe messenger, confirmăm stocul și termenele.",
  "Получите": "Primești",
  "Встреча в Кишинёве или доставка по Молдове.": "Întâlnire în Chișinău sau livrare în Moldova.",
  "Проверка перед выдачей": "Verificare înainte de predare",
  "Осматриваем каждую вещь и присылаем фото перед отправкой.": "Verificăm fiecare produs și trimitem poze înainte de expediere.",
  "Встреча в Кишинёве": "Întâlnire în Chișinău",
  "Примерка на месте, оплата при получении.": "Probă pe loc, plata la primire.",
  "Вся Молдова": "Toată Moldova",
  "Почта или курьер в любой город за 1–3 дня.": "Poștă sau curier în orice oraș în 1–3 zile.",
  "Не нашли модель?": "N-ai găsit modelul?",
  "Пришлите фото или название — найдём и привезём из Китая.": "Trimite o poză sau numele — îl găsim și îl aducem din China.",
  "Скоро здесь появятся товары.": "În curând vor apărea produse aici.",

  // категории и подкатегории
  "Обувь": "Încălțăminte",
  "Одежда": "Îmbrăcăminte",
  "Аксессуары": "Accesorii",
  "Сумки": "Genți",
  "Кроссовки": "Sneakers",
  "Кеды": "Teniși",
  "Ботинки": "Ghete",
  "Туфли и лоферы": "Pantofi și loafers",
  "Сандалии и шлёпанцы": "Sandale și papuci",
  "Футболки": "Tricouri",
  "Лонгсливы": "Bluze cu mânecă lungă",
  "Худи и свитшоты": "Hanorace și bluze",
  "Свитеры и кардиганы": "Pulovere și cardigane",
  "Рубашки": "Cămăși",
  "Куртки": "Geci",
  "Пуховики": "Geci de puf",
  "Жилеты": "Veste",
  "Пальто": "Paltoane",
  "Джинсы": "Blugi",
  "Брюки": "Pantaloni",
  "Спортивные штаны": "Pantaloni sport",
  "Шорты": "Pantaloni scurți",
  "Спортивные костюмы": "Costume sport",
  "Платья и юбки": "Rochii și fuste",
  "Нижнее бельё и носки": "Lenjerie și șosete",
  "Кепки и панамы": "Șepci și pălării",
  "Шапки": "Căciuli",
  "Ремни": "Curele",
  "Очки": "Ochelari",
  "Украшения": "Bijuterii",
  "Часы": "Ceasuri",
  "Шарфы и перчатки": "Fulare și mănuși",
  "Через плечо": "De umăr",
  "Рюкзаки": "Rucsacuri",
  "Поясные": "De talie",
  "Шопперы": "Sacoșe",
  "Кошельки и картхолдеры": "Portofele și cardholdere",

  // каталог
  "Фильтры": "Filtre",
  "Бренд": "Brand",
  "Размер": "Mărime",
  "Цена, лей": "Preț, lei",
  "Только со скидкой": "Doar cu reducere",
  "Показать": "Arată",
  "Сначала новые": "Mai întâi noi",
  "Сначала дешевле": "Mai întâi ieftine",
  "Сначала дороже": "Mai întâi scumpe",
  "Самые большие скидки": "Cele mai mari reduceri",
  "Ничего не нашлось": "Nu am găsit nimic",
  "Сбросить фильтры": "Resetează filtrele",
  "Каталог брендовой обуви, одежды и аксессуаров. В наличии в Кишинёве и под заказ из Китая.":
    "Catalog de încălțăminte, haine și accesorii de brand. În stoc în Chișinău și la comandă din China.",
  "Подкатегории": "Subcategorii",
  "Закрыть фильтры": "Închide filtrele",
  "от": "de la",
  "до": "până la",
  "Цена от": "Preț de la",
  "Цена до": "Preț până la",
  "Товары": "Produse",
  "Бренд или модель": "Brand sau model",
  "Поиск в каталоге": "Căutare în catalog",
  "Сортировка": "Sortare",
  "Со скидкой": "Cu reducere",

  // товар
  "Товар": "Produs",
  "Похожие": "Similare",
  "Брендовые вещи — Bine Store, Кишинёв.": "Haine de brand — Bine Store, Chișinău.",
  "Товар не найден или снят с продажи": "Produsul nu a fost găsit sau nu mai este în vânzare",
  "Вернуться в каталог": "Înapoi la catalog",
  "Готово к выдаче в Кишинёве": "Gata de ridicare în Chișinău",
  "Выберите размер": "Alege mărimea",
  "Добавить в корзину": "Adaugă în coș",
  "Осматриваем вещь перед выдачей": "Verificăm produsul înainte de predare",
  "Встреча и примерка в Кишинёве бесплатно": "Întâlnire și probă în Chișinău gratuit",
  "Доставка по Молдове 1–3 дня": "Livrare în Moldova 1–3 zile",
  "Описание": "Descriere",
  "Оплата": "Plată",
  "Встреча в Кишинёве — бесплатно, с примеркой.": "Întâlnire în Chișinău — gratuit, cu probă.",
  "Доставка по Молдове почтой или курьером — 1–3 дня после подтверждения.": "Livrare în Moldova prin poștă sau curier — 1–3 zile după confirmare.",
  "Наличными или переводом при получении.": "Numerar sau transfer la primire.",
  "Для заказов из Китая — предоплата, остаток при получении.": "Pentru comenzile din China — avans, restul la primire.",
  "Фото": "Poză",
  "Предыдущее фото": "Poza anterioară",
  "Следующее фото": "Poza următoare",

  // оформление
  "Оформление заказа": "Plasarea comenzii",
  "Оформление": "Comandă",
  "Войдите, чтобы следить за заказом в личном кабинете": "Intră în cont ca să urmărești comanda",
  "Контакты": "Contacte",
  "Имя": "Nume",
  "Телефон": "Telefon",
  "Получение": "Primire",
  "Бесплатно, с примеркой": "Gratuit, cu probă",
  "Доставка по Молдове": "Livrare în Moldova",
  "Почта или курьер, 1–3 дня": "Poștă sau curier, 1–3 zile",
  "Город или село": "Oraș sau sat",
  "Адрес или отделение почты": "Adresa sau oficiul poștal",
  "Связь": "Contact",
  "как удобнее подтвердить заказ": "cum preferi să confirmăm comanda",
  "Комментарий": "Comentariu",
  "Например, удобное время встречи": "De exemplu, ora potrivită pentru întâlnire",
  "Я принимаю": "Accept",
  "условия": "termenii",
  "правила возврата": "regulile de retur",
  "и даю согласие на обработку данных по": "și îmi dau acordul pentru prelucrarea datelor conform",
  "политике конфиденциальности": "politicii de confidențialitate",
  "Ваш заказ": "Comanda ta",
  "Бесплатно": "Gratuit",
  "По тарифу службы": "Conform tarifului",
  "Подтвердить заказ": "Confirmă comanda",
  "Оплата при получении": "Plata la primire",
  "Звонок": "Apel",
  "Заполните отмеченные поля": "Completează câmpurile marcate",
  "Подтвердите согласие с условиями, чтобы оформить заказ": "Confirmă acordul cu termenii pentru a plasa comanda",
  "Заказ принят": "Comanda a fost primită",
  "Мы свяжемся с вами в ближайшее время. Чтобы ускорить подтверждение — отправьте заказ нам в мессенджер.":
    "Te contactăm în curând. Ca să confirmăm mai repede — trimite-ne comanda pe messenger.",
  "Написать менеджеру в Telegram": "Scrie managerului pe Telegram",
  "Продолжить покупки": "Continuă cumpărăturile",

  // кабинет
  "Вход": "Intrare",
  "Регистрация": "Înregistrare",
  "Email": "Email",
  "Пароль": "Parolă",
  "Мне исполнилось 16 лет": "Am împlinit 16 ani",
  "Принимаю": "Accept",
  "и даю согласие на обработку данных по": "și îmi dau acordul pentru prelucrarea datelor conform",
  "Забыли пароль?": "Ai uitat parola?",
  "С возвращением": "Bine ai revenit",
  "Новый аккаунт": "Cont nou",
  "Сброс пароля": "Resetarea parolei",
  "Заказы, избранное и быстрое оформление.": "Comenzi, favorite și plasare rapidă.",
  "Следите за заказами и сохраняйте избранное.": "Urmărește comenzile și salvează favoritele.",
  "Пришлём ссылку для нового пароля на email.": "Îți trimitem pe email un link pentru o parolă nouă.",
  "Создать аккаунт": "Creează cont",
  "Отправить ссылку": "Trimite link",
  "Скрыть пароль": "Ascunde parola",
  "Показать пароль": "Arată parola",
  "Проверьте отмеченные поля": "Verifică câmpurile marcate",
  "Регистрация доступна с 16 лет": "Înregistrarea este disponibilă de la 16 ani",
  "Подтвердите согласие с условиями и политикой": "Confirmă acordul cu termenii și politica",
  "Заказы": "Comenzi",
  "Профиль": "Profil",
  "Админ-панель": "Panou admin",
  "CRM": "CRM",
  "Выйти": "Ieși",
  "Вы вышли из аккаунта": "Ai ieșit din cont",
  "Мои заказы": "Comenzile mele",
  "Заказов пока нет": "Încă nu ai comenzi",
  "В каталог": "La catalog",
  "Заказать из Китая": "Comandă din China",
  "Заявки под заказ": "Cereri la comandă",
  "Сохраняйте вещи сердечком": "Salvează produsele cu inimioara",
  "Город": "Oraș",
  "Адрес доставки": "Adresa de livrare",
  "Сохранить": "Salvează",
  "Удалить аккаунт": "Șterge contul",
  "Удалятся профиль, избранное и вход. История заказов хранится для учёта; её удаление — по запросу, см.":
    "Se vor șterge profilul, favoritele și accesul. Istoricul comenzilor se păstrează pentru evidență; ștergerea lui — la cerere, vezi",
  "политику конфиденциальности": "politica de confidențialitate",
  "Профиль сохранён": "Profil salvat",
  "Нажмите ещё раз, чтобы удалить навсегда": "Apasă încă o dată pentru a șterge definitiv",
  "Аккаунт удалён": "Cont șters",
  "Выйдите и войдите снова, затем повторите удаление": "Ieși și intră din nou, apoi repetă ștergerea",
  "Разделы кабинета": "Secțiunile contului",
  "Принят": "Primită",
  "Подтверждён": "Confirmată",
  "Получен": "Primită",
  "Новый": "Nouă",
  "Выкуплен": "Cumpărată",
  "Отправлен": "Expediată",
  "Приехал": "A sosit",
  "Выдан": "Predată",
  "Заказан в Китае": "Comandată în China",
  "В пути": "În drum",
  "Готов к выдаче": "Gata de ridicare",
  "Выполнен": "Finalizată",
  "Отменён": "Anulată",
  "Новая": "Nouă",
  "Ищем": "Căutăm",
  "Предложение": "Ofertă",
  "Предоплата": "Avans",
  "Выкуплено": "Cumpărat",
  "Приехало": "A sosit",
  "Выдано": "Predat",
  "Отменена": "Anulată",
  "Вещь": "Produs",
  "Ссылка": "Link",
  "Цвет": "Culoare",
  "Количество": "Cantitate",
  "Бюджет": "Buget",
  "Клиент": "Client",
  "Аккаунт": "Cont",
  "Статус заказа": "Statusul comenzii",
  "Статус заявки": "Statusul cererii",

  // под заказ
  "Под заказ из Китая": "La comandă din China",
  "Опишите вещь или пришлите фото — найдём у поставщика, назовём цену и срок.":
    "Descrie produsul sau trimite o poză — îl găsim la furnizor și îți spunem prețul și termenul.",
  "Что ищете": "Ce cauți",
  "Название или модель *": "Denumire sau model *",
  "Ссылка на товар": "Link spre produs",
  "Фото — до 3 штук": "Poze — până la 3",
  "Добавить фото": "Adaugă poze",
  "Скриншот или снимок вещи": "Captură de ecran sau poză a produsului",
  "Бюджет до, лей": "Buget până la, lei",
  "Имя *": "Nume *",
  "Телефон *": "Telefon *",
  "Где удобнее связаться": "Cum preferi să te contactăm",
  "Даю согласие на обработку данных по": "Îmi dau acordul pentru prelucrarea datelor conform",
  "Отправить заявку": "Trimite cererea",
  "Как это работает": "Cum funcționează",
  "Заявка": "Cerere",
  "Вы описываете вещь — это бесплатно и ни к чему не обязывает.": "Descrii produsul — e gratuit și nu te obligă la nimic.",
  "Свяжемся в течение дня: цена, срок, фото от поставщика.": "Te contactăm în aceeași zi: preț, termen, poze de la furnizor.",
  "Заказ": "Comandă",
  "После вашего согласия — предоплата и выкуп.": "După acordul tău — avans și achiziție.",
  "Обычно 14–20 дней. Встреча в Кишинёве или доставка по Молдове.": "De obicei 14–20 zile. Întâlnire în Chișinău sau livrare în Moldova.",
  "Пришлите название или фото вещи — найдём и привезём из Китая за 14–20 дней. Встреча в Кишинёве или доставка по Молдове.":
    "Trimite numele sau o poză a produsului — îl găsim și îl aducem din China în 14–20 zile. Întâlnire în Chișinău sau livrare în Moldova.",
  "Например, Nike Dunk Low Panda": "De exemplu, Nike Dunk Low Panda",
  "Poizon, 1688, Instagram — если есть": "Poizon, 1688, Instagram — dacă ai",
  "42, M, One size": "42, M, One size",
  "Подтвердите согласие на обработку данных": "Confirmă acordul pentru prelucrarea datelor",
  "Дождитесь загрузки фото": "Așteaptă încărcarea pozelor",
  "Заявка отправлена": "Cererea a fost trimisă",
  "Мы свяжемся с вами в течение дня, назовём цену и срок доставки.": "Te contactăm în aceeași zi și îți spunem prețul și termenul de livrare.",
  "Написать менеджеру": "Scrie managerului",
  "Мои заявки": "Cererile mele",
  "Ещё одна заявка": "Încă o cerere",
  "Telegram": "Telegram",

  // доставка
  "0 лей": "0 lei",
  "Договоримся о месте и времени. Примерка на месте, оплата при получении.": "Stabilim locul și ora. Probă pe loc, plata la primire.",
  "Почтой или курьером в любой город. Стоимость — по тарифу службы доставки.": "Prin poștă sau curier în orice oraș. Costul — conform tarifului serviciului de livrare.",
  "Почти любая модель и размер. Перед отправкой присылаем фото вещи.": "Aproape orice model și mărime. Înainte de expediere trimitem poze ale produsului.",
  "Наличными или переводом при получении. Для заказов из Китая — предоплата, остаток при получении.":
    "Numerar sau transfer la primire. Pentru comenzile din China — avans, restul la primire.",
  "1 день": "1 zi",
  "Подтверждение": "Confirmare",
  "Уточняем модель, размер и цену.": "Confirmăm modelul, mărimea și prețul.",
  "2–5 дней": "2–5 zile",
  "Выкуп": "Achiziție",
  "Заказываем у проверенного поставщика.": "Comandăm de la un furnizor verificat.",
  "10–14 дней": "10–14 zile",
  "Фото перед отправкой, затем путь в Молдову.": "Poze înainte de expediere, apoi drumul spre Moldova.",
  "Финиш": "Final",
  "Встреча в Кишинёве или отправка по Молдове.": "Întâlnire în Chișinău sau expediere în Moldova.",
  "Вопросы": "Întrebări",
  "Как проверяется вещь?": "Cum se verifică produsul?",
  "Осматриваем каждую вещь перед выдачей. Для заказов из Китая присылаем фото до отправки — вы видите вещь заранее.":
    "Verificăm fiecare produs înainte de predare. Pentru comenzile din China trimitem poze înainte de expediere — vezi produsul din timp.",
  "Можно примерить?": "Pot să probez?",
  "При встрече в Кишинёве — да, примерка на месте.": "La întâlnirea în Chișinău — da, proba pe loc.",
  "Нет нужной модели в каталоге": "Nu găsesc modelul în catalog",
  "Пришлите фото или название в мессенджер — найдём и привезём из Китая.": "Trimite o poză sau numele pe messenger — îl găsim și îl aducem din China.",
  "Как отследить заказ?": "Cum urmăresc comanda?",
  "Зарегистрируйтесь — статус заказа виден в личном кабинете. Также пишем в мессенджер на каждом этапе.":
    "Înregistrează-te — statusul comenzii se vede în cont. De asemenea, îți scriem pe messenger la fiecare etapă.",
  "Встреча в Кишинёве, доставка по Молдове, заказ брендовых вещей из Китая за 14–20 дней.":
    "Întâlnire în Chișinău, livrare în Moldova, comandă de haine de brand din China în 14–20 zile.",

  // 404 и документы
  "Страница не найдена": "Pagina nu a fost găsită",
  "Такой страницы нет — но в каталоге много интересного.": "Această pagină nu există — dar în catalog sunt multe lucruri interesante.",
  "Политика конфиденциальности": "Politica de confidențialitate",
  "Политика конфиденциальности магазина Bine Store.": "Politica de confidențialitate a magazinului Bine Store.",
  "Условия использования магазина Bine Store.": "Termenii de utilizare ai magazinului Bine Store.",
  "Возврат и обмен магазина Bine Store.": "Retur și schimb în magazinul Bine Store.",
  "Файлы cookie магазина Bine Store.": "Fișierele cookie ale magazinului Bine Store.",

  // ошибки
  "Этот email уже зарегистрирован": "Acest email este deja înregistrat",
  "Неверный email или пароль": "Email sau parolă greșită",
  "Проверьте email": "Verifică emailul",
  "Пароль — минимум 6 символов": "Parola — minimum 6 caractere",
  "Слишком много попыток. Попробуйте позже": "Prea multe încercări. Încearcă mai târziu",
  "Нет соединения с интернетом": "Nu există conexiune la internet",
  "Недостаточно прав": "Drepturi insuficiente",
  "Что-то пошло не так. Попробуйте ещё раз": "Ceva n-a mers. Încearcă din nou",
  "В демо-режиме восстановление пароля недоступно": "În modul demo resetarea parolei nu este disponibilă",
};

/* фразы с числами и именами */
const plural = (n) => (n === 1 ? "produs" : n % 100 === 0 || n % 100 >= 20 ? "de produse" : "produse");
const RULES = [
  [/^(\d+) (товар|товара|товаров)$/, (m, n) => `${n} ${plural(+n)}`],
  [/^Размер (.+?) × (\d+) · (.+)$/, (m, s, q, st) => `Mărime ${s} × ${q} · ${tr(st)}`],
  [/^Размер (.+?) · (.+)$/, (m, s, st) => `Mărime ${s} · ${tr(st)}`],
  [/^Размер (.+)$/, (m, s) => `Mărime ${s}`],
  [/^Добавлено: (.+), размер (.+)$/, (m, b, s) => `Adăugat: ${b}, mărimea ${s}`],
  [/^Срок доставки (.+) дней$/, (m, d) => `Termen de livrare ${d} zile`],
  [/^(.+) — нет в наличии$/, (m, s) => `${s} — nu este în stoc`],
  [/^Заказ из Китая — (.+) дней\. Перед отправкой присылаем фото вещи\.$/, (m, d) => `Comandă din China — ${d} zile. Înainte de expediere trimitem poze ale produsului.`],
  [/^Доставка: (.+)$/, (m, a) => `Livrare: ${a}`],
  [/^(\d+) фото$/, (m, n) => `${n} ${+n === 1 ? "poză" : "poze"}`],
  [/^Фото (\d+)$/, (m, n) => `Poza ${n}`],
  [/^Открыть фото (\d+)$/, (m, n) => `Deschide poza ${n}`],
  [/^Удалить фото (\d+)$/, (m, n) => `Șterge poza ${n}`],
  [/^Фото к заявке (.+), (\d+)$/, (m, z, n) => `Poza la cererea ${z}, ${n}`],
  [/^до (.+)$/, (m, a) => `până la ${a}`],
  [/^(\d+) – (.+) лей$/, (m, a, b) => `${a} – ${b} lei`],
  [/^Привет, (.+)$/, (m, n) => `Salut, ${n}`],
  [/^Вы вошли как (.+)$/, (m, n) => `Ai intrat ca ${n}`],
  [/^Ссылка отправлена на (.+)$/, (m, e) => `Link trimis la ${e}`],
  [/^Не удалось обработать (.+)\. Попробуйте JPG или PNG$/, (m, f) => `Nu am putut procesa ${f}. Încearcă JPG sau PNG`],
  [/^© (\d+) (.+)\. Товарные знаки принадлежат их владельцам\.$/, (m, y, n) => `© ${y} ${n}. Mărcile comerciale aparțin proprietarilor lor.`],
  [/^(.+), Молдова$/, (m, c) => `${tr(c)}, Moldova`],
  [/^(.+) лей$/, (m, a) => `${a} lei`],
];

function tr(src) {
  if (lang !== "ro" || !src) return src;
  const s = src.trim();
  if (!s || !/[А-Яа-яЁё]/.test(s)) return src;
  let out = DICT[s];
  if (out == null)
    for (const [re, fn] of RULES) {
      const m = s.match(re);
      if (m) {
        out = fn(...m);
        break;
      }
    }
  if (out == null && s.includes("\n")) {
    const lines = s.split("\n").map((l) => tr(l));
    out = lines.join("\n");
  }
  if (out == null && /\s[—·]\s/.test(s)) {
    const parts = s.split(/(\s[—·]\s)/);
    const done = parts.map((p) => (/^\s[—·]\s$/.test(p) ? p : tr(p)));
    if (done.join("") !== s) out = done.join("");
  }
  if (out == null) return src;
  // сохраняем пробелы по краям исходного текста
  return src.replace(s, out);
}
/** перевести строку для JS-кода (например, текст в ссылке) */
export const t = (s) => tr(s);

/* ---------------- перевод DOM ---------------- */
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);
function fixNode(n) {
  if (n.nodeType === 3) {
    const p = n.parentNode;
    if (!p || SKIP.has(p.nodeName) || p.closest?.("[data-no-i18n]")) return;
    const v = tr(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
  } else if (n.nodeType === 1) {
    if (n.hasAttribute("data-no-i18n")) return;
    for (const a of ATTRS)
      if (n.hasAttribute(a)) {
        const v = n.getAttribute(a);
        const x = tr(v);
        if (x !== v) n.setAttribute(a, x);
      }
    if (SKIP.has(n.nodeName)) return; // содержимое поля ввода не трогаем
    for (const c of n.childNodes) fixNode(c);
  }
}

function translateHead() {
  document.title = tr(document.title);
  for (const m of document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[property="og:title"]')) m.content = tr(m.content);
}

if (lang === "ro") {
  document.documentElement.lang = "ro";
  translateHead();
  fixNode(document.body);
  new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === "childList") r.addedNodes.forEach(fixNode);
      else if (r.type === "characterData") fixNode(r.target);
      else if (r.type === "attributes") fixNode(r.target);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  new MutationObserver(() => {
    const v = tr(document.title);
    if (v !== document.title) document.title = v;
  }).observe(document.querySelector("title"), { childList: true, characterData: true, subtree: true });
}
document.documentElement.classList.remove("i18n-wait");
