import { initLayout, $, esc, lang } from "../ui.js?v=17";
import { SHOP, COMPANY, LEGAL_UPDATED } from "../config.js?v=17";

await initLayout("");

/* Пустые реквизиты подсвечиваются, чтобы их было видно до публикации. */
const req = (v, label) => (v ? esc(v) : `<mark>${label}</mark>`);
const seller = `${req(COMPANY.name, "[название продавца]")}, IDNO ${req(COMPANY.idno, "[IDNO]")}, адрес: ${req(COMPANY.address, "[юридический адрес]")}`;
const mail = COMPANY.email ? `<a href="mailto:${esc(COMPANY.email)}">${esc(COMPANY.email)}</a>` : `<mark>[email]</mark>`;
const tg = SHOP.telegram ? ` или менеджеру в Telegram <a href="https://t.me/${esc(SHOP.telegram)}" target="_blank" rel="noopener">@${esc(SHOP.telegram)}</a>` : "";

const DOCS = {
  privacy: `
<p class="upd">Обновлено: ${LEGAL_UPDATED}</p>
<p>Эта политика объясняет, какие данные собирает сайт ${esc(SHOP.name)}, зачем и как вы можете ими управлять. Обработка ведётся в соответствии с Законом Республики Молдова № 133/2011 «О защите персональных данных».</p>
<h2>Кто обрабатывает данные</h2>
<p>Оператор: ${seller}. Связь по вопросам данных: ${mail}${tg}.</p>
<h2>Какие данные мы собираем</h2>
<ul>
<li><b>При заказе:</b> имя, телефон, способ получения, город и адрес (при доставке), комментарий, состав заказа.</li>
<li><b>При регистрации:</b> email, имя, зашифрованный пароль (хранится у Google Firebase, мы его не видим), подтверждение возраста и согласия.</li>
<li><b>В профиле</b> — по желанию: телефон, город, адрес, список избранного.</li>
<li><b>В браузере:</b> корзина, избранное, выбор по cookie, сессия входа. Подробнее — в <a href="cookies.html">политике cookie</a>.</li>
</ul>
<p>Мы не собираем платёжные данные: оплата происходит при получении.</p>
<h2>Зачем</h2>
<ul>
<li>Оформить, подтвердить и доставить заказ — основание: исполнение договора.</li>
<li>Вести личный кабинет и историю заказов — основание: ваше согласие при регистрации.</li>
<li>Хранить заказы для учёта — основание: требования законодательства.</li>
</ul>
<p>Мы не продаём данные и не используем их для рекламы. Рассылок не делаем; если они появятся, в каждом письме будет ссылка для отписки.</p>
<h2>Сторонние сервисы</h2>
<ul>
<li><b>Google Firebase</b> (Authentication, Firestore) — хранение аккаунтов, товаров и заказов. Серверы Google могут находиться за пределами Молдовы; Google применяет стандартные договорные условия по защите данных.</li>
<li><b>Google Fonts</b> — загрузка шрифтов; Google получает ваш IP-адрес.</li>
<li><b>Telegram, WhatsApp, Viber</b> — только если вы сами нажимаете кнопку мессенджера.</li>
</ul>
<h2>Сколько храним</h2>
<p>Данные аккаунта — пока аккаунт существует. Заказы — столько, сколько требует бухгалтерский и налоговый учёт, затем удаляются.</p>
<h2>Ваши права</h2>
<p>Вы можете узнать, какие данные о вас хранятся, исправить их, отозвать согласие и потребовать удаления. Аккаунт можно удалить самостоятельно: «Личный кабинет → Профиль → Удалить аккаунт». Удалить данные заказов можно запросом на ${mail}; ответим в течение 15 рабочих дней. Жалобу можно подать в Национальный центр по защите персональных данных (datepersonale.md).</p>
<h2>Дети</h2>
<p>Сайт не предназначен для лиц младше 16 лет. При регистрации мы просим подтвердить возраст. Если вы узнали, что ребёнок передал нам данные, напишите на ${mail} — мы их удалим.</p>`,

  terms: `
<p class="upd">Обновлено: ${LEGAL_UPDATED}</p>
<p>Используя сайт и оформляя заказ, вы соглашаетесь с этими условиями.</p>
<h2>Продавец</h2>
<p>${seller}. Контакты: ${mail}${COMPANY.phone ? `, ${esc(COMPANY.phone)}` : ""}.</p>
<h2>Товары</h2>
<ul>
<li>Товары делятся на «В наличии» (находятся в Кишинёве) и «Из Китая» (заказываются у поставщика после подтверждения).</li>
<li>Фото и описания предоставлены для ознакомления; оттенок может немного отличаться из-за настроек экрана.</li>
<li>Названия брендов и товарные знаки принадлежат их владельцам. ${esc(SHOP.name)} не является официальным представителем или дилером этих брендов.</li>
</ul>
<h2>Заказ и цена</h2>
<ul>
<li>Оформление на сайте — это заявка. Договор заключается после того, как мы подтвердим наличие, цену и сроки.</li>
<li>Цены указаны в леях. Стоимость доставки по Молдове — по тарифу службы доставки, её называем при подтверждении.</li>
<li>Для заказов из Китая может потребоваться предоплата; её размер согласовываем заранее.</li>
</ul>
<h2>Сроки</h2>
<p>Встреча в Кишинёве — по договорённости. Доставка по Молдове — обычно 1–3 дня. Заказ из Китая — обычно ${esc(SHOP.chinaDays)}; срок может измениться из-за перевозчика или таможни, мы предупредим заранее.</p>
<h2>Возврат</h2>
<p>Порядок описан в разделе <a href="returns.html">«Возврат и обмен»</a>.</p>
<h2>Аккаунт</h2>
<p>Регистрация доступна с 16 лет. Вы отвечаете за сохранность пароля. Мы можем заблокировать аккаунт, используемый для мошенничества.</p>
<h2>Споры</h2>
<p>Мы решаем вопросы переговорами. Если договориться не удалось, спор рассматривается по законодательству Республики Молдова; права потребителя защищает Закон № 105/2003 «О защите прав потребителей».</p>`,

  returns: `
<p class="upd">Обновлено: ${LEGAL_UPDATED}</p>
<h2>Возврат надлежащего товара</h2>
<p>Вы можете вернуть товар в течение <b>14 дней</b> с момента получения, если он не был в носке, сохранены бирки, упаковка и товарный вид. При встрече в Кишинёве вы можете примерить вещь и отказаться от неё сразу.</p>
<p>Не подлежат возврату по гигиеническим причинам: нижнее бельё, носки и купальники, если упаковка вскрыта.</p>
<h2>Товар с браком или не тот товар</h2>
<p>Сообщите нам в течение 14 дней с фото. Мы заменим товар или вернём деньги, а расходы на пересылку возьмём на себя.</p>
<h2>Как оформить</h2>
<ol>
<li>Напишите на ${mail}${tg}: номер заказа и причину.</li>
<li>Договоримся о встрече в Кишинёве или об отправке.</li>
<li>Вернём деньги тем же способом, которым вы платили, в течение 14 дней после получения товара.</li>
</ol>
<h2>Расходы на пересылку</h2>
<p>При возврате надлежащего товара обратную отправку оплачивает покупатель. При браке — мы.</p>`,

  cookies: `
<p class="upd">Обновлено: ${LEGAL_UPDATED}</p>
<p>Cookie и локальное хранилище — небольшие данные в вашем браузере. Мы используем только то, что нужно для работы сайта.</p>
<h2>Что мы храним</h2>
<ul>
<li><b>binestore-cart-v2</b> — корзина (localStorage, до очистки).</li>
<li><b>binestore-fav</b> — избранное (localStorage).</li>
<li><b>bs-consent</b> — ваш выбор по cookie (localStorage).</li>
<li><b>bs-lang</b> — выбранный язык (localStorage).</li>
<li><b>bs-intro</b> — показ заставки один раз за визит (sessionStorage).</li>
<li><b>Firebase Auth</b> — сессия входа в аккаунт (IndexedDB), только если вы вошли.</li>
</ul>
<h2>Сторонние</h2>
<ul>
<li><b>Google Fonts</b> — загрузка шрифтов, передаёт Google ваш IP-адрес. Cookie не ставит.</li>
<li><b>Google Firebase</b> — база данных и вход в аккаунт.</li>
</ul>
<p>Рекламных, аналитических и отслеживающих cookie нет. Если они появятся, мы спросим ваше согласие отдельно.</p>
<h2>Как управлять</h2>
<p>Изменить выбор можно по ссылке «Настройки cookie» внизу страницы. Удалить данные можно в настройках браузера — тогда очистятся корзина и избранное, а из аккаунта вы выйдете.</p>`,
};

/* ---------------- Română ---------------- */
const upd = "26 octombrie 2026";
const sellerRo = `${req(COMPANY.name, "[denumirea vânzătorului]")}, IDNO ${req(COMPANY.idno, "[IDNO]")}, adresa: ${req(COMPANY.address, "[adresa juridică]")}`;
const tgRo = SHOP.telegram ? ` sau managerului pe Telegram <a href="https://t.me/${esc(SHOP.telegram)}" target="_blank" rel="noopener">@${esc(SHOP.telegram)}</a>` : "";

const DOCS_RO = {
  privacy: `
<p class="upd">Actualizat: ${upd}</p>
<p>Această politică explică ce date colectează site-ul ${esc(SHOP.name)}, de ce și cum le poți gestiona. Prelucrarea se efectuează în conformitate cu Legea Republicii Moldova nr. 133/2011 „Privind protecția datelor cu caracter personal”.</p>
<h2>Cine prelucrează datele</h2>
<p>Operator: ${sellerRo}. Contact pentru întrebări despre date: ${mail}${tgRo}.</p>
<h2>Ce date colectăm</h2>
<ul>
<li><b>La comandă:</b> nume, telefon, modul de primire, orașul și adresa (la livrare), comentariul, conținutul comenzii.</li>
<li><b>La înregistrare:</b> email, nume, parola criptată (păstrată de Google Firebase, noi nu o vedem), confirmarea vârstei și a acordului.</li>
<li><b>În profil</b> — opțional: telefon, oraș, adresă, lista de favorite.</li>
<li><b>În browser:</b> coșul, favoritele, limba, alegerea privind cookie-urile, sesiunea de autentificare. Detalii — în <a href="cookies.html">politica cookie</a>.</li>
</ul>
<p>Nu colectăm date de plată: plata se face la primire.</p>
<h2>De ce</h2>
<ul>
<li>Pentru a înregistra, confirma și livra comanda — temei: executarea contractului.</li>
<li>Pentru contul personal și istoricul comenzilor — temei: acordul tău la înregistrare.</li>
<li>Pentru păstrarea comenzilor în evidență — temei: cerințele legislației.</li>
</ul>
<p>Nu vindem datele și nu le folosim pentru publicitate. Nu trimitem newslettere; dacă vor apărea, fiecare mesaj va conține un link de dezabonare.</p>
<h2>Servicii terțe</h2>
<ul>
<li><b>Google Firebase</b> (Authentication, Firestore) — stocarea conturilor, produselor și comenzilor. Serverele Google pot fi situate în afara Moldovei; Google aplică clauze contractuale standard de protecție a datelor.</li>
<li><b>Google Fonts</b> — încărcarea fonturilor; Google primește adresa ta IP.</li>
<li><b>Telegram</b> — doar dacă apeși tu butonul de mesagerie.</li>
</ul>
<h2>Cât timp păstrăm</h2>
<p>Datele contului — cât timp există contul. Comenzile — atât cât cere evidența contabilă și fiscală, apoi sunt șterse.</p>
<h2>Drepturile tale</h2>
<p>Poți afla ce date despre tine sunt păstrate, le poți corecta, îți poți retrage acordul și poți cere ștergerea lor. Contul îl poți șterge singur: „Contul meu → Profil → Șterge contul”. Ștergerea datelor comenzilor — la cerere pe ${mail}; răspundem în 15 zile lucrătoare. Poți depune o plângere la Centrul Național pentru Protecția Datelor cu Caracter Personal (datepersonale.md).</p>
<h2>Copii</h2>
<p>Site-ul nu este destinat persoanelor sub 16 ani. La înregistrare cerem confirmarea vârstei. Dacă afli că un copil ne-a transmis date, scrie-ne la ${mail} — le vom șterge.</p>`,

  terms: `
<p class="upd">Actualizat: ${upd}</p>
<p>Folosind site-ul și plasând o comandă, ești de acord cu acești termeni.</p>
<h2>Vânzătorul</h2>
<p>${sellerRo}. Contacte: ${mail}${COMPANY.phone ? `, ${esc(COMPANY.phone)}` : ""}.</p>
<h2>Produsele</h2>
<ul>
<li>Produsele din catalog sunt în stoc în Chișinău. Modelele lipsă pot fi comandate din China prin formularul „La comandă”.</li>
<li>Pozele și descrierile au caracter informativ; nuanța poate diferi puțin din cauza setărilor ecranului.</li>
<li>Denumirile brandurilor și mărcile comerciale aparțin proprietarilor lor. ${esc(SHOP.name)} nu este reprezentant oficial sau dealer al acestor branduri.</li>
</ul>
<h2>Comanda și prețul</h2>
<ul>
<li>Plasarea pe site este o cerere. Contractul se încheie după ce confirmăm stocul, prețul și termenele.</li>
<li>Prețurile sunt în lei. Costul livrării în Moldova — conform tarifului serviciului de livrare, îl comunicăm la confirmare.</li>
<li>Pentru comenzile din China poate fi necesar un avans; mărimea lui o stabilim din timp.</li>
</ul>
<h2>Termene</h2>
<p>Întâlnire în Chișinău — după înțelegere. Livrare în Moldova — de obicei 1–3 zile. Comandă din China — de obicei 14–20 zile; termenul se poate schimba din cauza transportatorului sau a vămii, te anunțăm din timp.</p>
<h2>Returul</h2>
<p>Procedura este descrisă în secțiunea <a href="returns.html">„Retur și schimb”</a>.</p>
<h2>Contul</h2>
<p>Înregistrarea este disponibilă de la 16 ani. Ești responsabil pentru păstrarea parolei. Putem bloca un cont folosit pentru fraudă.</p>
<h2>Litigii</h2>
<p>Rezolvăm problemele prin negocieri. Dacă nu ajungem la o înțelegere, litigiul se examinează conform legislației Republicii Moldova; drepturile consumatorului sunt protejate de Legea nr. 105/2003 „Privind protecția consumatorilor”.</p>`,

  returns: `
<p class="upd">Actualizat: ${upd}</p>
<h2>Returul unui produs corespunzător</h2>
<p>Poți returna produsul în <b>14 zile</b> de la primire, dacă nu a fost purtat și are etichetele, ambalajul și aspectul comercial păstrate. La întâlnirea în Chișinău poți proba produsul și renunța la el pe loc.</p>
<p>Din motive de igienă nu se returnează: lenjeria, șosetele și costumele de baie, dacă ambalajul a fost deschis.</p>
<h2>Produs cu defect sau alt produs</h2>
<p>Anunță-ne în 14 zile cu o poză. Înlocuim produsul sau returnăm banii, iar costurile de expediere le suportăm noi.</p>
<h2>Cum se face</h2>
<ol>
<li>Scrie la ${mail}${tgRo}: numărul comenzii și motivul.</li>
<li>Stabilim o întâlnire în Chișinău sau expedierea.</li>
<li>Returnăm banii prin aceeași metodă prin care ai plătit, în 14 zile de la primirea produsului.</li>
</ol>
<h2>Costurile de expediere</h2>
<p>La returul unui produs corespunzător, expedierea înapoi o plătește cumpărătorul. La defect — noi.</p>`,

  cookies: `
<p class="upd">Actualizat: ${upd}</p>
<p>Cookie-urile și stocarea locală sunt date mici din browserul tău. Folosim doar ce este necesar pentru funcționarea site-ului.</p>
<h2>Ce păstrăm</h2>
<ul>
<li><b>binestore-cart-v2</b> — coșul (localStorage, până la ștergere).</li>
<li><b>binestore-fav</b> — favoritele (localStorage).</li>
<li><b>bs-consent</b> — alegerea ta privind cookie-urile (localStorage).</li>
<li><b>bs-lang</b> — limba aleasă (localStorage).</li>
<li><b>bs-intro</b> — afișarea introducerii o singură dată pe vizită (sessionStorage).</li>
<li><b>Firebase Auth</b> — sesiunea de autentificare (IndexedDB), doar dacă ai intrat în cont.</li>
</ul>
<h2>Terți</h2>
<ul>
<li><b>Google Fonts</b> — încărcarea fonturilor, transmite Google adresa ta IP. Nu setează cookie-uri.</li>
<li><b>Google Firebase</b> — baza de date și autentificarea.</li>
</ul>
<p>Nu avem cookie-uri de publicitate, analiză sau urmărire. Dacă vor apărea, îți vom cere acordul separat.</p>
<h2>Cum le gestionezi</h2>
<p>Poți schimba alegerea prin linkul „Setări cookie” din josul paginii. Datele le poți șterge din setările browserului — atunci se vor goli coșul și favoritele, iar tu vei ieși din cont.</p>`,
};

$("#doc").innerHTML = (lang === "ro" ? DOCS_RO : DOCS)[document.body.dataset.doc] || "";
