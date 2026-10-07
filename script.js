const body = document.body;

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeStorageKey = "trego-theme";

const menuButton = document.getElementById("menuButton");
const openMenuGallery = document.getElementById("openMenuGallery");
const menuLightbox = document.getElementById("menuLightbox");
const menuLightboxBackdrop = document.getElementById("menuLightboxBackdrop");
const menuLightboxClose = document.getElementById("menuLightboxClose");
const menuLightboxImage = document.getElementById("menuLightboxImage");
const menuPrev = document.getElementById("menuPrev");
const menuNext = document.getElementById("menuNext");

const menuImages = [
  "assets/1.png",
  "assets/2.png",
  "assets/3.png",
  "assets/4.png",
  "assets/5.png",
];

let currentMenuImage = 0;

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.textContent = theme === "dark" ? "☾" : "☀";
}

function applyTheme(theme) {
  body.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

const savedTheme = localStorage.getItem(themeStorageKey);

if (savedTheme === "light" || savedTheme === "dark") {
  applyTheme(savedTheme);
} else {
  applyTheme("dark");
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const currentTheme = body.getAttribute("data-theme");
    const nextTheme = currentTheme === "light" ? "dark" : "light";

    applyTheme(nextTheme);
    localStorage.setItem(themeStorageKey, nextTheme);
  });
}

// ---- Burger / mobile nav toggle ----
const burgerBtn = document.getElementById("burgerBtn");
const mainNav = document.getElementById("mainNav");

function closeNav() {
  mainNav.classList.remove("open");
  burgerBtn.classList.remove("open");
  burgerBtn.setAttribute("aria-expanded", "false");
}

if (burgerBtn && mainNav) {
  burgerBtn.addEventListener("click", function () {
    const isOpen = mainNav.classList.toggle("open");
    burgerBtn.classList.toggle("open", isOpen);
    burgerBtn.setAttribute("aria-expanded", isOpen);
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", function (event) {
    if (
      mainNav.classList.contains("open") &&
      !mainNav.contains(event.target) &&
      !burgerBtn.contains(event.target)
    ) {
      closeNav();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });
}

function updateMenuImage() {
  if (!menuLightboxImage) return;
  menuLightboxImage.src = menuImages[currentMenuImage];
  menuLightboxImage.alt = `trego menu page ${currentMenuImage + 1}`;
}

function openLightbox(index = 0) {
  if (!menuLightbox) return;
  currentMenuImage = index;
  updateMenuImage();
  menuLightbox.classList.add("open");
  menuLightbox.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeLightbox() {
  if (!menuLightbox) return;
  menuLightbox.classList.remove("open");
  menuLightbox.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

function showNextImage() {
  currentMenuImage = (currentMenuImage + 1) % menuImages.length;
  updateMenuImage();
}

function showPrevImage() {
  currentMenuImage =
    (currentMenuImage - 1 + menuImages.length) % menuImages.length;
  updateMenuImage();
}

if (menuButton) {
  menuButton.addEventListener("click", function () {
    openLightbox(0);
  });
}

if (openMenuGallery) {
  openMenuGallery.addEventListener("click", function () {
    openLightbox(0);
  });
}

if (menuNext) {
  menuNext.addEventListener("click", function (event) {
    event.stopPropagation();
    showNextImage();
  });
}

if (menuPrev) {
  menuPrev.addEventListener("click", function (event) {
    event.stopPropagation();
    showPrevImage();
  });
}

if (menuLightboxClose) {
  menuLightboxClose.addEventListener("click", function (event) {
    event.stopPropagation();
    closeLightbox();
  });
}

if (menuLightboxBackdrop) {
  menuLightboxBackdrop.addEventListener("click", closeLightbox);
}

document.addEventListener("keydown", function (event) {
  if (menuLightbox && menuLightbox.classList.contains("open")) {
    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowRight") {
      showNextImage();
    }

    if (event.key === "ArrowLeft") {
      showPrevImage();
    }
  }
});
const defaultBookedDates = {};

const defaultMaybeDates = [];

// Live dates: a Google Sheet published as CSV (File > Share > Publish to web > CSV).
// Row 1 is the header: date | status | event
//   date   YYYY-MM-DD (format the column as Plain text so Sheets keeps it that way)
//   status "booked" or "maybe" (blank counts as booked)
//   event  optional name shown when a booked date is tapped
// When set, the sheet replaces the two lists above; they remain the fallback
// if the sheet cannot be loaded. Leave empty to use only the lists above.
const availabilitySheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMh3WCIUiFH7Fbtiwt1qmIBFJP0S4GuALQCT5_afriOoAxen7NR3sGbN8NZuiw5KDnDD1yvgXU9Mvj/pub?gid=0&single=true&output=csv";

function parseAvailabilityCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  // Anything without our header is not the sheet (e.g. a Google sign-in page).
  if (!/^"?date/i.test(lines[0])) return null;
  const booked = {};
  const maybe = [];
  const skipped = [];
  lines.slice(1).forEach((line) => {
    if (!line.replace(/[",\s]/g, "")) return;
    const [date, status = "", ...rest] = line.split(",");
    const key = date.replace(/"/g, "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return skipped.push(line);
    const event = rest
      .join(",")
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/""/g, '"');
    if (/^\s*"?m/i.test(status)) maybe.push(key);
    else booked[key] = event || "Private Event";
  });
  return { booked, maybe, skipped };
}

const availabilityStorageKey = "trego-availability-v2";
const availabilityCalendars = document.getElementById("availabilityCalendars");
const availabilityPrev = document.getElementById("availabilityPrev");
const availabilityNext = document.getElementById("availabilityNext");
const copyAvailabilityData = document.getElementById("copyAvailabilityData");
const resetAvailabilityData = document.getElementById("resetAvailabilityData");
const availabilityManagerToast = document.getElementById(
  "availabilityManagerToast",
);

const eventLightbox = document.getElementById("eventLightbox");
const eventLightboxBackdrop = document.getElementById("eventLightboxBackdrop");
const eventLightboxClose = document.getElementById("eventLightboxClose");
const eventLightboxDate = document.getElementById("eventLightboxDate");
const eventLightboxTitle = document.getElementById("eventLightboxTitle");
const eventLightboxEvent = document.getElementById("eventLightboxEvent");
const eventLightboxNote = document.getElementById("eventLightboxNote");

const today = new Date();
today.setHours(0, 0, 0, 0);
let availabilityOffset = 0;

// Open the live site with ?manage=1 to enable editing.
const manageAvailability =
  new URLSearchParams(window.location.search).get("manage") === "1";
if (manageAvailability) document.body.classList.add("availability-manage-mode");

function loadAvailabilityData() {
  const base = {};
  defaultMaybeDates.forEach((date) => (base[date] = "maybe"));
  Object.keys(defaultBookedDates).forEach((date) => (base[date] = "booked"));

  // Device-only edits apply in manager mode only, so they never hide the real dates.
  if (!manageAvailability) return base;

  try {
    const stored = JSON.parse(
      localStorage.getItem(availabilityStorageKey) || "{}",
    );
    return { ...base, ...stored };
  } catch (error) {
    return base;
  }
}

let availabilityData = loadAvailabilityData();

function saveAvailabilityData() {
  localStorage.setItem(
    availabilityStorageKey,
    JSON.stringify(availabilityData),
  );
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateStatus(key) {
  return availabilityData[key] || "available";
}

function setDateStatus(key, status) {
  if (status === "available") {
    delete availabilityData[key];
  } else {
    availabilityData[key] = status;
  }
  saveAvailabilityData();
}

function nextDateStatus(status) {
  if (status === "available") return "maybe";
  if (status === "maybe") return "booked";
  return "available";
}

function flashManagerMessage(message) {
  if (!availabilityManagerToast) return;
  availabilityManagerToast.textContent = message;
  window.clearTimeout(flashManagerMessage.timer);
  flashManagerMessage.timer = window.setTimeout(() => {
    availabilityManagerToast.textContent = "";
  }, 2200);
}

function getBookedEvent(key) {
  return defaultBookedDates[key] || "Private Event";
}

function formatEventDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function openEventLightbox(key) {
  showLightbox(
    formatEventDate(key),
    getBookedEvent(key),
    "BOOKED",
    "trego is booked for this date.",
  );
}

// One pop-up for booked dates and for full-length reviews.
function showLightbox(kicker, title, tag, note) {
  if (!eventLightbox) return;
  eventLightboxDate.textContent = kicker;
  eventLightboxTitle.textContent = title;
  eventLightboxEvent.textContent = tag;
  eventLightboxNote.textContent = note;
  eventLightbox.classList.add("open");
  eventLightbox.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeEventLightbox() {
  if (!eventLightbox) return;
  eventLightbox.classList.remove("open");
  eventLightbox.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

if (eventLightboxClose) {
  eventLightboxClose.addEventListener("click", closeEventLightbox);
}

if (eventLightboxBackdrop) {
  eventLightboxBackdrop.addEventListener("click", closeEventLightbox);
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && eventLightbox?.classList.contains("open")) {
    closeEventLightbox();
  }
});

function renderAvailabilityMonth(year, month) {
  const monthEl = document.createElement("div");
  monthEl.className = "availability-month";

  const title = document.createElement("div");
  title.className = "availability-month-title";
  title.textContent = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
  monthEl.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((label) => {
    const weekday = document.createElement("div");
    weekday.className = "calendar-weekday";
    weekday.textContent = label;
    grid.appendChild(weekday);
  });

  const firstDay = new Date(year, month, 1);
  const leading = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < leading; i++)
    grid.appendChild(document.createElement("div"));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const key = dateKey(year, month, day);
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = day;

    if (date < today) {
      cell.classList.add("past");
      cell.title = "Past date";
    } else {
      const status = getDateStatus(key);
      cell.classList.add(status);
      cell.dataset.date = key;
      cell.dataset.status = status;
      cell.title = manageAvailability
        ? `${key}: ${status}. Click to change.`
        : `${key}: ${status}`;

      if (manageAvailability) {
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        const changeStatus = () => {
          const current = getDateStatus(key);
          const next = nextDateStatus(current);
          setDateStatus(key, next);
          flashManagerMessage(`${key} changed to ${next}.`);
          renderAvailability();
        };
        cell.addEventListener("click", changeStatus);
        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            changeStatus();
          }
        });
      } else if (status === "booked") {
        cell.classList.add("booked-clickable");
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        cell.setAttribute(
          "aria-label",
          `${formatEventDate(key)} — ${getBookedEvent(key)}`,
        );
        cell.title = `${getBookedEvent(key)} — click for details`;

        const showEvent = () => openEventLightbox(key);
        cell.addEventListener("click", showEvent);
        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            showEvent();
          }
        });
      }
    }

    if (date.getTime() === today.getTime()) cell.classList.add("today");
    grid.appendChild(cell);
  }

  monthEl.appendChild(grid);
  return monthEl;
}

function renderAvailability() {
  if (!availabilityCalendars) return;
  availabilityCalendars.innerHTML = "";

  const date = new Date(
    today.getFullYear(),
    today.getMonth() + availabilityOffset,
    1,
  );

  availabilityCalendars.appendChild(
    renderAvailabilityMonth(date.getFullYear(), date.getMonth()),
  );

  if (availabilityPrev) availabilityPrev.disabled = availabilityOffset === 0;
}

if (availabilityPrev) {
  availabilityPrev.addEventListener("click", function () {
    availabilityOffset = Math.max(0, availabilityOffset - 1);
    renderAvailability();
  });
}

if (availabilityNext) {
  availabilityNext.addEventListener("click", function () {
    availabilityOffset += 1;
    renderAvailability();
  });
}

if (copyAvailabilityData) {
  copyAvailabilityData.addEventListener("click", async function () {
    const text = JSON.stringify(availabilityData, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      flashManagerMessage("Date data copied.");
    } catch (error) {
      window.prompt("Copy your availability data:", text);
    }
  });
}

if (resetAvailabilityData) {
  resetAvailabilityData.addEventListener("click", function () {
    localStorage.removeItem(availabilityStorageKey);
    availabilityData = loadAvailabilityData();
    renderAvailability();
    flashManagerMessage("Local changes reset.");
  });
}

renderAvailability();

if (availabilitySheetUrl) {
  fetch(availabilitySheetUrl)
    .then((response) =>
      response.ok ? response.text() : Promise.reject(response.status),
    )
    .then((text) => {
      const sheet = parseAvailabilityCsv(text);
      if (!sheet) throw new Error("response is not the availability sheet");
      Object.keys(defaultBookedDates).forEach(
        (key) => delete defaultBookedDates[key],
      );
      Object.assign(defaultBookedDates, sheet.booked);
      defaultMaybeDates.splice(0, Infinity, ...sheet.maybe);
      availabilityData = loadAvailabilityData();
      renderAvailability();
      if (sheet.skipped.length) {
        console.warn("Availability sheet rows ignored:", sheet.skipped);
        flashManagerMessage(
          `${sheet.skipped.length} sheet row(s) ignored: dates must be YYYY-MM-DD.`,
        );
      }
    })
    .catch((error) =>
      console.warn(
        "Availability sheet unavailable, using built-in dates.",
        error,
      ),
    );
}

// Testimonials: a second tab of the same Google Sheet, published as CSV the same way
// (File > Share > Publish to web > pick the reviews tab > CSV).
// Row 1 is the header: show | name | stars | review
//   show   tick the checkbox (or type yes) on the reviews you want on the site
//   name   the guest name to display
//   stars  1 to 5, as given on Google (blank shows no stars)
//   review the review text, pasted as-is
// Only ticked rows appear, in sheet order. While this is empty, or if the sheet
// cannot be loaded, the Testimonials section and its nav link stay hidden.
const reviewsSheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMh3WCIUiFH7Fbtiwt1qmIBFJP0S4GuALQCT5_afriOoAxen7NR3sGbN8NZuiw5KDnDD1yvgXU9Mvj/pub?gid=82909702&single=true&output=csv";

function parseReviewsCsv(text) {
  // Reviews contain commas, quotes and line breaks, so this reads quoted fields properly.
  const rows = [[""]];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const row = rows[rows.length - 1];
    const last = row.length - 1;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') row[last] += text[i++];
      else if (char === '"') quoted = false;
      else row[last] += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") row.push("");
    else if (char === "\n") rows.push([""]);
    else if (char !== "\r") row[last] += char;
  }
  // Anything without our header is not the sheet (e.g. a Google sign-in page).
  if (!/^show$/i.test(rows[0][0].trim())) return null;
  return rows
    .slice(1)
    .filter(
      ([show, , , review = ""]) =>
        /^(true|y|x|1)/i.test(show.trim()) && review.trim(),
    )
    .map(([, name, stars, review]) => ({
      name: name.trim(),
      // Whole stars only; anything that is not 1 to 5 shows no stars.
      stars: /^\s*[1-5]\s*$/.test(stars) ? Number(stars) : 0,
      review: review.trim(),
    }));
}

// Reviews carousel: moves one card at a time and wraps round at either end.
// Swipe and snapping are plain CSS; this only drives the auto-advance.
const reviewCards = document.getElementById("reviewCards");
const reviewsSection = document.getElementById("testimonials");
const reviewsAutoAdvanceMs = 5000;

function moveReviews(direction) {
  const card = reviewCards.firstElementChild;
  if (!card) return;
  const end = reviewCards.scrollWidth - reviewCards.clientWidth;
  const step = card.offsetWidth + parseFloat(getComputedStyle(reviewCards).columnGap);
  let left = reviewCards.scrollLeft + direction * step;
  if (left > end + 4) left = 0;
  if (left < -4) left = end;
  reviewCards.scrollTo({ left, behavior: "smooth" });
}

// Auto-advance, paused while a guest is hovering, touching or tabbing through the
// reviews, and switched off for visitors who ask their device for reduced motion.
let reviewsPaused = false;
["pointerenter", "focusin"].forEach((type) =>
  reviewsSection.addEventListener(type, () => (reviewsPaused = true)),
);
["pointerleave", "focusout"].forEach((type) =>
  reviewsSection.addEventListener(type, () => (reviewsPaused = false)),
);
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => {
    if (reviewsPaused || document.hidden) return;
    if (body.classList.contains("modal-open")) return;
    moveReviews(1);
  }, reviewsAutoAdvanceMs);
}

// "See more" only shows on cards whose quote is cut off at the current screen width.
function markLongReviews() {
  reviewCards.querySelectorAll(".service-card").forEach((card) => {
    const quote = card.querySelector("p");
    card.querySelector("button").hidden =
      quote.scrollHeight <= quote.clientHeight + 1;
  });
}

if (reviewsSheetUrl) {
  fetch(reviewsSheetUrl)
    .then((response) =>
      response.ok ? response.text() : Promise.reject(response.status),
    )
    .then((text) => {
      const reviews = parseReviewsCsv(text);
      if (!reviews) throw new Error("response is not the reviews sheet");
      if (!reviews.length) return;
      document.getElementById("reviewCards").replaceChildren(
        ...reviews.map(({ name, stars, review }) => {
          const card = document.createElement("article");
          card.className = "service-card";
          if (stars) {
            const rating = card.appendChild(document.createElement("div"));
            rating.className = "accent-text";
            rating.setAttribute("role", "img");
            rating.setAttribute("aria-label", `${stars} out of 5 stars`);
            rating.textContent = "★".repeat(stars) + "☆".repeat(5 - stars);
          }
          // textContent, never innerHTML: sheet text is shown as text only.
          card.appendChild(document.createElement("p")).textContent =
            `“${review}”`;
          const more = card.appendChild(document.createElement("button"));
          more.type = "button";
          more.className = "accent-text";
          more.textContent = "See more";
          more.setAttribute("aria-label", `See ${name}'s full review`);
          more.addEventListener("click", () =>
            showLightbox(
              "★".repeat(stars) + "☆".repeat(stars && 5 - stars),
              name,
              "GOOGLE REVIEW",
              `“${review}”`,
            ),
          );
          card.appendChild(document.createElement("h3")).textContent = name;
          return card;
        }),
      );
      document
        .querySelectorAll('#testimonials, a[href="#testimonials"]')
        .forEach((element) => (element.hidden = false));
      markLongReviews();
      window.addEventListener("resize", markLongReviews);
    })
    .catch((error) => console.warn("Reviews sheet unavailable.", error));
}
