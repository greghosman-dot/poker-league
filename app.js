/**
 * Poker League — mobile signup + seat assignment (client-only demo)
 * State persists in localStorage so refreshes keep seats taken.
 */

const STORAGE_KEY = "poker-league-demo-v1";
const SEATS_PER_TABLE = 9;
const TABLE_COUNT = 4; // 1–10 supported; start with 4 for a typical night

const EVENT = {
  id: "event-2026-07-14-tue",
  name: "Tuesday Night Hold'em",
  when: "Tue, Jul 14 · 7:00 PM",
  where: "The Brass Rail · Main Room",
  signupWindow: "Opens morning of event",
};

/** Seed a few taken seats so the map feels real on first visit. */
const SEED_TAKEN = [
  { table: 1, seat: 1, name: "Jordan K." },
  { table: 1, seat: 4, name: "Sam P." },
  { table: 1, seat: 7, name: "Riley M." },
  { table: 2, seat: 2, name: "Chris L." },
  { table: 2, seat: 5, name: "Morgan T." },
  { table: 3, seat: 3, name: "Casey W." },
  { table: 3, seat: 8, name: "Taylor B." },
];

const state = {
  step: 1,
  player: { name: "", email: "", phone: "" },
  selected: null, // { table, seat }
  activeTable: 1,
  seats: {}, // "t-s" -> { status: "open"|"taken", name?: string, email?: string }
};

// --- DOM ---
const els = {
  stepIndicators: () => document.querySelectorAll("[data-step-indicator]"),
  panels: () => document.querySelectorAll("[data-step]"),
  form: document.getElementById("signup-form"),
  formError: document.getElementById("form-error"),
  name: document.getElementById("player-name"),
  email: document.getElementById("player-email"),
  phone: document.getElementById("player-phone"),
  seatsLeft: document.getElementById("event-seats-left"),
  eventName: document.getElementById("event-name"),
  eventWhen: document.getElementById("event-when"),
  eventWhere: document.getElementById("event-where"),
  eventSignup: document.getElementById("event-signup-window"),
  tableTabs: document.getElementById("table-tabs"),
  tableStage: document.getElementById("table-stage"),
  selectionBar: document.getElementById("selection-bar"),
  selectionValue: document.getElementById("selection-value"),
  confirmSeatBtn: document.getElementById("confirm-seat-btn"),
  backToInfo: document.getElementById("back-to-info"),
  successLead: document.getElementById("success-lead"),
  summaryList: document.getElementById("summary-list"),
  changeSeatBtn: document.getElementById("change-seat-btn"),
  startOverBtn: document.getElementById("start-over-btn"),
};

function seatKey(table, seat) {
  return `${table}-${seat}`;
}

function totalSeats() {
  return TABLE_COUNT * SEATS_PER_TABLE;
}

function openSeatCount() {
  return Object.values(state.seats).filter((s) => s.status === "open").length;
}

function initSeats() {
  state.seats = {};
  for (let t = 1; t <= TABLE_COUNT; t++) {
    for (let s = 1; s <= SEATS_PER_TABLE; s++) {
      state.seats[seatKey(t, s)] = { status: "open" };
    }
  }
  for (const taken of SEED_TAKEN) {
    const key = seatKey(taken.table, taken.seat);
    if (state.seats[key]) {
      state.seats[key] = { status: "taken", name: taken.name };
    }
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      initSeats();
      return;
    }
    const data = JSON.parse(raw);
    if (data.eventId !== EVENT.id || !data.seats) {
      initSeats();
      return;
    }
    state.seats = data.seats;
    if (data.registration) {
      state.player = data.registration.player;
      state.selected = data.registration.selected;
      state.step = 3;
      state.activeTable = data.registration.selected?.table || 1;
    }
  } catch {
    initSeats();
  }
}

function save(registration = null) {
  const payload = {
    eventId: EVENT.id,
    seats: state.seats,
    registration,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function setStep(step) {
  state.step = step;
  els.panels().forEach((panel) => {
    const n = Number(panel.dataset.step);
    const active = n === step;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  els.stepIndicators().forEach((el) => {
    const n = Number(el.dataset.stepIndicator);
    el.classList.toggle("is-active", n === step);
    el.classList.toggle("is-done", n < step);
  });
  if (step === 2) {
    renderSeatStep();
  }
  if (step === 3) {
    renderSuccess();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateForm() {
  const name = els.name.value.trim();
  const email = els.email.value.trim();
  const phone = els.phone.value.trim();
  els.formError.hidden = true;

  if (!name) {
    return fail("Please enter your name.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Please enter a valid email.");
  }

  state.player = { name, email, phone };
  return true;

  function fail(msg) {
    els.formError.textContent = msg;
    els.formError.hidden = false;
    return false;
  }
}

function openCountForTable(table) {
  let n = 0;
  for (let s = 1; s <= SEATS_PER_TABLE; s++) {
    if (state.seats[seatKey(table, s)]?.status === "open") n++;
  }
  return n;
}

function renderEventMeta() {
  els.eventName.textContent = EVENT.name;
  els.eventWhen.textContent = EVENT.when;
  els.eventWhere.textContent = EVENT.where;
  els.eventSignup.textContent = EVENT.signupWindow;
  els.seatsLeft.textContent = `${openSeatCount()} of ${totalSeats()}`;
}

function renderTableTabs() {
  els.tableTabs.innerHTML = "";
  for (let t = 1; t <= TABLE_COUNT; t++) {
    const open = openCountForTable(t);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "table-tab" + (t === state.activeTable ? " is-active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(t === state.activeTable));
    btn.innerHTML = `Table ${t} <span class="avail">· ${open} open</span>`;
    btn.addEventListener("click", () => {
      state.activeTable = t;
      renderSeatStep();
    });
    els.tableTabs.appendChild(btn);
  }
}

/**
 * Place seats on an ellipse around the felt.
 * seat 1 at top-center, then clockwise.
 */
function seatPosition(index, total) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  // percentages of stage size; leave margin for seat buttons
  const rx = 38;
  const ry = 36;
  const x = 50 + rx * Math.cos(angle);
  const y = 50 + ry * Math.sin(angle);
  return { x, y };
}

function renderTableStage() {
  const table = state.activeTable;
  els.tableStage.innerHTML = "";

  const oval = document.createElement("div");
  oval.className = "felt-oval";
  oval.setAttribute("aria-hidden", "true");
  els.tableStage.appendChild(oval);

  const label = document.createElement("div");
  label.className = "table-label";
  label.innerHTML = `<strong>Table ${table}</strong><span>${SEATS_PER_TABLE}-max</span>`;
  els.tableStage.appendChild(label);

  for (let s = 1; s <= SEATS_PER_TABLE; s++) {
    const key = seatKey(table, s);
    const info = state.seats[key] || { status: "open" };
    const isSelected =
      state.selected &&
      state.selected.table === table &&
      state.selected.seat === s;

    const pos = seatPosition(s - 1, SEATS_PER_TABLE);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat";
    btn.style.left = `${pos.x}%`;
    btn.style.top = `${pos.y}%`;
    btn.dataset.table = String(table);
    btn.dataset.seat = String(s);

    if (isSelected) {
      btn.classList.add("is-selected");
      btn.innerHTML = `${s}<small>You</small>`;
      btn.setAttribute("aria-label", `Table ${table} seat ${s}, selected`);
    } else if (info.status === "taken") {
      btn.classList.add("is-taken");
      btn.disabled = true;
      const short = (info.name || "Taken").split(" ")[0];
      btn.innerHTML = `${s}<small>${escapeHtml(short)}</small>`;
      btn.setAttribute(
        "aria-label",
        `Table ${table} seat ${s}, taken by ${info.name || "another player"}`
      );
    } else {
      btn.classList.add("is-open");
      btn.innerHTML = `${s}<small>Open</small>`;
      btn.setAttribute("aria-label", `Table ${table} seat ${s}, open`);
      btn.addEventListener("click", () => selectSeat(table, s));
    }

    els.tableStage.appendChild(btn);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function selectSeat(table, seat) {
  const key = seatKey(table, seat);
  if (state.seats[key]?.status === "taken") return;

  // free previous tentative selection (not yet confirmed as taken by us)
  state.selected = { table, seat };
  renderSeatStep();
}

function renderSelectionBar() {
  if (!state.selected) {
    els.selectionBar.hidden = true;
    return;
  }
  els.selectionBar.hidden = false;
  els.selectionValue.textContent = `Table ${state.selected.table} · Seat ${state.selected.seat}`;
}

function renderSeatStep() {
  renderTableTabs();
  renderTableStage();
  renderSelectionBar();
  renderEventMeta();
}

function confirmSeat() {
  if (!state.selected) return;
  const { table, seat } = state.selected;
  const key = seatKey(table, seat);
  const current = state.seats[key];

  if (!current || current.status === "taken") {
    alert("That seat was just taken. Pick another.");
    state.selected = null;
    renderSeatStep();
    return;
  }

  // If player already had a confirmed seat this session, free it first
  releasePlayerSeatIfAny();

  state.seats[key] = {
    status: "taken",
    name: state.player.name,
    email: state.player.email,
  };

  save({
    player: state.player,
    selected: state.selected,
    confirmedAt: new Date().toISOString(),
  });

  setStep(3);
}

function releasePlayerSeatIfAny() {
  const email = state.player.email?.toLowerCase();
  if (!email) return;
  for (const [key, info] of Object.entries(state.seats)) {
    if (info.email?.toLowerCase() === email) {
      state.seats[key] = { status: "open" };
    }
  }
}

function renderSuccess() {
  const sel = state.selected;
  els.successLead.textContent = `${state.player.name}, you're at ${EVENT.name}.`;
  els.summaryList.innerHTML = `
    <dt>Event</dt><dd>${escapeHtml(EVENT.name)}</dd>
    <dt>When</dt><dd>${escapeHtml(EVENT.when)}</dd>
    <dt>Where</dt><dd>${escapeHtml(EVENT.where)}</dd>
    <dt>Seat</dt><dd>Table ${sel?.table ?? "—"} · Seat ${sel?.seat ?? "—"}</dd>
    <dt>Email</dt><dd>${escapeHtml(state.player.email)}</dd>
  `;
  renderEventMeta();
}

function changeSeat() {
  // Free current seat so they can re-pick
  if (state.selected) {
    const key = seatKey(state.selected.table, state.selected.seat);
    const info = state.seats[key];
    if (info?.email?.toLowerCase() === state.player.email.toLowerCase()) {
      state.seats[key] = { status: "open" };
    }
  }
  save(null);
  state.activeTable = state.selected?.table || 1;
  setStep(2);
}

function startOver() {
  if (state.selected) {
    const key = seatKey(state.selected.table, state.selected.seat);
    const info = state.seats[key];
    if (info?.email?.toLowerCase() === state.player.email?.toLowerCase()) {
      state.seats[key] = { status: "open" };
    }
  }
  state.player = { name: "", email: "", phone: "" };
  state.selected = null;
  state.activeTable = 1;
  els.form.reset();
  save(null);
  setStep(1);
  renderEventMeta();
}

function bind() {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setStep(2);
  });

  els.backToInfo.addEventListener("click", () => setStep(1));
  els.confirmSeatBtn.addEventListener("click", confirmSeat);
  els.changeSeatBtn.addEventListener("click", changeSeat);
  els.startOverBtn.addEventListener("click", startOver);

  // Prefill form if we have player data mid-flow
  if (state.player.name) {
    els.name.value = state.player.name;
    els.email.value = state.player.email;
    els.phone.value = state.player.phone || "";
  }
}

function boot() {
  load();
  renderEventMeta();
  bind();
  setStep(state.step);
}

boot();
