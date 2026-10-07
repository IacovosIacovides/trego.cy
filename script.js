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
const defaultBookedDates = {
  "2026-09-09": "Pop up at Lost + Found Drinkery",
  "2026-09-10": "Pop up at Lost + Found Drinkery",
  "2026-09-11": "Private Event",
  "2026-09-19": "Private Event",
  "2026-09-24": "Private Event",
  "2026-09-29": "Pop up at Lost + Found Drinkery",
  "2026-09-30": "Pop up at Lost + Found Drinkery",
  "2026-10-10": "Cooking at National CPF",
  "2026-10-11": "Cooking at National CPF",
  "2026-11-10": "Pop up at Lost + Found Drinkery",
  "2026-11-11": "Pop up at Lost + Found Drinkery",
  "2026-12-02": "Pop up at Lost + Found Drinkery",
  "2026-12-03": "Pop up at Lost + Found Drinkery",
  "2026-10-16": "Private Event",
  "2026-10-17": "Private Event",
  "2026-10-25": "Private Event",
};

const defaultMaybeDates = [
  "2026-09-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-28",
  "2026-10-30",
];

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
  if (!eventLightbox) return;
  const event = getBookedEvent(key);
  eventLightboxDate.textContent = formatEventDate(key);
  eventLightboxTitle.textContent = event;
  eventLightboxEvent.textContent = "BOOKED";
  eventLightboxNote.textContent = "trego is booked for this date.";
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
