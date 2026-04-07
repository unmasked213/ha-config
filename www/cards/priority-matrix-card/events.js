// /config/www/cards/priority-matrix-card/events.js
// Interaction handlers and HA service calls.
// Circle sliders and number inputs emit ui-change events — no custom pointer logic needed.

import { CRITERIA, DEFAULT_SCORES, computeScore, parseScores, serializeScores } from "./constants.js";
import { createTaskRow, updateScorePill, updateSortIndicators, applySliderFillColor } from "./render.js";
import { showRichTooltip, hideRichTooltip } from "/local/base/tooltips.js";

/**
 * Attach all event handlers to the card.
 * @param {Object} card - The card instance (PriorityMatrixCard)
 */
export function attachEvents(card) {
  const root = card.shadowRoot;

  // ── Add task (inline input — Enter to submit, clear after)
  const addField = root.getElementById("pm-add-field");
  if (addField) {
    const submit = () => {
      const name = addField.value.trim();
      if (!name) return;
      addTask(card, name);
      addField.value = "";
      const pill = addField.closest(".ui-input__pill");
      if (pill) pill.classList.remove("has-value");
    };
    addField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    addField.addEventListener("blur", submit);
    addField.addEventListener("input", () => {
      const pill = addField.closest(".ui-input__pill");
      if (pill) pill.classList.toggle("has-value", addField.value.length > 0);
    });
  }

  // ── Drawer open/close
  const drawerFab = root.getElementById("pm-drawer-fab");
  const drawerPanel = root.querySelector(".ui-drawer");
  const drawerBackdrop = root.querySelector(".ui-drawer-backdrop");
  const drawerClose = root.querySelector(".ui-drawer__close");

  const openDrawer = () => {
    drawerPanel?.classList.add("is-open");
    drawerBackdrop?.classList.add("is-visible");
  };
  const closeDrawer = () => {
    drawerPanel?.classList.remove("is-open");
    drawerBackdrop?.classList.remove("is-visible");
  };

  drawerFab?.addEventListener("click", openDrawer);
  drawerClose?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);

  // ── Weight stepper changes (ui-change from <ui-number-input>)
  root.getElementById("pm-weights")?.addEventListener("ui-change", (e) => {
    const stepper = e.target.closest("ui-number-input");
    if (!stepper) return;
    const key = stepper.dataset.key;
    if (!key) return;
    card._weights[key] = e.detail.value;
    recalcAllScores(card);
  });

  // ── Column header sorting + tooltips
  const colHeaders = root.getElementById("pm-col-headers");
  colHeaders?.addEventListener("click", (e) => {
    const header = e.target.closest(".pm-col-header[data-sort]");
    if (!header) return;
    toggleSort(card, header.dataset.sort);
  });

  // Build tooltip lookup from criteria
  const tooltipMap = {};
  for (const c of CRITERIA) {
    tooltipMap[c.key] = c.tooltip;
  }

  // Desktop: hover to show tooltip on criterion headers
  let headerTooltipTimer = null;
  colHeaders?.addEventListener("mouseenter", (e) => {
    const header = e.target.closest(".pm-col-header[data-sort]");
    if (!header) return;
    const tip = tooltipMap[header.dataset.sort];
    if (!tip) return;
    clearTimeout(headerTooltipTimer);
    headerTooltipTimer = setTimeout(() => {
      showRichTooltip(header, tip, { position: "bottom", delay: 0 });
    }, 400);
  }, true);

  colHeaders?.addEventListener("mouseleave", (e) => {
    const header = e.target.closest(".pm-col-header[data-sort]");
    if (!header) return;
    clearTimeout(headerTooltipTimer);
    hideRichTooltip();
  }, true);

  // Touch: long-press for tooltip on criterion headers
  let headerLongPress = null;
  let headerLongFired = false;
  colHeaders?.addEventListener("touchstart", (e) => {
    const header = e.target.closest(".pm-col-header[data-sort]");
    if (!header) return;
    const tip = tooltipMap[header.dataset.sort];
    if (!tip) return;
    headerLongFired = false;
    headerLongPress = setTimeout(() => {
      headerLongFired = true;
      showRichTooltip(header, tip, { position: "bottom", persistent: true, delay: 0 });
    }, 500);
  }, { passive: true });

  colHeaders?.addEventListener("touchend", () => {
    clearTimeout(headerLongPress);
    if (headerLongFired) {
      // Suppress click so it doesn't also sort
      colHeaders.addEventListener("click", (e) => e.stopImmediatePropagation(), { once: true, capture: true });
    }
  });

  colHeaders?.addEventListener("touchmove", () => clearTimeout(headerLongPress), { passive: true });

  // ── Task container delegation
  const tasks = root.getElementById("pm-tasks");
  if (!tasks) return;

  // Name input changes (debounced)
  tasks.addEventListener("input", (e) => {
    if (e.target.classList.contains("ui-input__field") && e.target.dataset.uid) {
      // Toggle has-value class for floating label
      const pill = e.target.closest(".ui-input__pill");
      if (pill) pill.classList.toggle("has-value", e.target.value.length > 0);
      handleNameChange(card, e.target);
    }
  });

  // Delete button clicks
  tasks.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".ui-btn--icon[data-uid]");
    if (deleteBtn) {
      deleteTask(card, deleteBtn.dataset.uid);
    }
  });

  // Circle slider value changes (ui-change from <ui-circle-slider>)
  tasks.addEventListener("ui-change", (e) => {
    const slider = e.target.closest("ui-circle-slider");
    if (!slider) return;
    const uid = slider.dataset.uid;
    const key = slider.dataset.key;
    if (!uid || !key) return;

    applySliderFillColor(slider, e.detail.value);
    updateTaskScore(card, uid, key, e.detail.value);
    scheduleWrite(card, uid);
    scheduleSortIfNeeded(card, key);
  });

  // Circle slider tap — reset to 2
  tasks.addEventListener("ui-tap", (e) => {
    const slider = e.target.closest("ui-circle-slider");
    if (!slider) return;
    const uid = slider.dataset.uid;
    const key = slider.dataset.key;
    if (!uid || !key) return;

    slider.value = 2;
    applySliderFillColor(slider, 2);
    updateTaskScore(card, uid, key, 2);
    scheduleWrite(card, uid);
    scheduleSortIfNeeded(card, key);
  });

  // Circle slider live drag (ui-input — update score pill without persisting)
  tasks.addEventListener("ui-input", (e) => {
    const slider = e.target.closest("ui-circle-slider");
    if (!slider) return;
    const uid = slider.dataset.uid;
    const key = slider.dataset.key;
    if (!uid || !key) return;

    applySliderFillColor(slider, e.detail.value);
    updateTaskScore(card, uid, key, e.detail.value);
  });
}

/**
 * Update a single criterion score in the local model and refresh the score pill.
 */
function updateTaskScore(card, uid, key, value) {
  const task = card._tasks.get(uid);
  if (!task) return;

  task.scores[key] = value;
  const score = computeScore(task.scores, card._weights);

  const pill = card.shadowRoot.querySelector(`.pm-score[data-uid="${uid}"]`);
  if (pill) updateScorePill(pill, score);
}

// ── Debounced write timers
const writeTimers = new Map();

function scheduleWrite(card, uid) {
  if (writeTimers.has(uid)) clearTimeout(writeTimers.get(uid));
  writeTimers.set(uid, setTimeout(() => {
    writeTimers.delete(uid);
    persistTask(card, uid);
  }, 500));
}

/**
 * Persist a task's scores to HA via todo.update_item.
 */
async function persistTask(card, uid) {
  const task = card._tasks.get(uid);
  if (!task || !card._hass || !card._config) return;

  try {
    await card._hass.callService("todo", "update_item", {
      item: uid,
      description: serializeScores(task.scores),
    }, { entity_id: card._config.entity });
  } catch (e) {
    console.warn("[priority-matrix-card] Failed to update item:", e);
  }
}

/**
 * Persist a task name change (debounced).
 */
const nameTimers = new Map();

function handleNameChange(card, input) {
  const uid = input.dataset.uid;
  const task = card._tasks.get(uid);
  if (!task) return;

  task.summary = input.value;

  if (nameTimers.has(uid)) clearTimeout(nameTimers.get(uid));
  nameTimers.set(uid, setTimeout(async () => {
    nameTimers.delete(uid);
    if (!card._hass || !card._config) return;
    try {
      await card._hass.callService("todo", "update_item", {
        item: uid,
        rename: input.value,
      }, { entity_id: card._config.entity });
    } catch (e) {
      console.warn("[priority-matrix-card] Failed to rename item:", e);
    }
  }, 500));
}

/**
 * Add a new task.
 */
async function addTask(card, name = "New task") {
  if (!card._hass || !card._config) return;

  try {
    await card._hass.callService("todo", "add_item", {
      item: name,
      description: serializeScores(DEFAULT_SCORES),
    }, { entity_id: card._config.entity });
  } catch (e) {
    console.warn("[priority-matrix-card] Failed to add item:", e);
  }
}

/**
 * Delete a task with fade-out + FLIP.
 */
async function deleteTask(card, uid) {
  if (!card._hass || !card._config) return;

  // Guard against double-delete (row mid-fade)
  if (card._deletingUids?.has(uid)) return;
  if (!card._deletingUids) card._deletingUids = new Set();
  card._deletingUids.add(uid);

  const container = card.shadowRoot.getElementById("pm-tasks");
  const row = container?.querySelector(`.pm-row[data-uid="${uid}"]`);
  if (!row || !container) {
    card._deletingUids.delete(uid);
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Snapshot positions of surviving rows before removal
  const snapshots = [];
  container.querySelectorAll(".pm-row").forEach(el => {
    if (el.dataset.uid !== uid) {
      snapshots.push({ el, top: el.getBoundingClientRect().top });
    }
  });

  if (reducedMotion) {
    row.remove();
  } else {
    // Fade out
    row.style.pointerEvents = "none";
    row.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 250, easing: "ease-in-out", fill: "forwards" }
    );
    await new Promise(r => setTimeout(r, 250));
    row.remove();
  }

  card._tasks.delete(uid);
  updateFooter(card);

  // FLIP surviving rows into new positions
  flipRows(snapshots);

  try {
    await card._hass.callService("todo", "remove_item", {
      item: uid,
    }, { entity_id: card._config.entity });
  } catch (e) {
    console.warn("[priority-matrix-card] Failed to delete item:", e);
    card._fetchItems();
  } finally {
    card._deletingUids.delete(uid);
  }
}

/**
 * Recalculate and update all score pills.
 */
export function recalcAllScores(card) {
  for (const [uid, task] of card._tasks) {
    const score = computeScore(task.scores, card._weights);
    const pill = card.shadowRoot.querySelector(`.pm-score[data-uid="${uid}"]`);
    if (pill) updateScorePill(pill, score);
  }

  if (card._sortKey === "score") {
    sortAndReorder(card);
  }
}

/**
 * Toggle sort on a column.
 */
function toggleSort(card, key) {
  if (card._sortKey === key) {
    card._sortDir = card._sortDir === "desc" ? "asc" : "desc";
  } else {
    card._sortKey = key;
    card._sortDir = key === "summary" ? "asc" : "desc";
  }

  updateSortIndicators(card.shadowRoot, card._sortKey, card._sortDir);
  sortAndReorder(card);
}

/**
 * Sort tasks and reorder DOM with FLIP animation.
 */
function sortAndReorder(card) {
  const container = card.shadowRoot.getElementById("pm-tasks");
  if (!container) return;

  // Snapshot positions before reorder
  const snapshots = [];
  container.querySelectorAll(".pm-row").forEach(el => {
    snapshots.push({ el, top: el.getBoundingClientRect().top });
  });

  const sorted = [...card._tasks.entries()].sort(([, a], [, b]) => {
    return compareTask(a, b, card._sortKey, card._sortDir, card._weights);
  });

  // Reorder DOM
  for (const [uid] of sorted) {
    const row = container.querySelector(`.pm-row[data-uid="${uid}"]`);
    if (row) container.appendChild(row);
  }

  const newMap = new Map();
  for (const [uid, task] of sorted) newMap.set(uid, task);
  card._tasks = newMap;

  // FLIP animate
  flipRows(snapshots);
}

function compareTask(a, b, key, dir, weights) {
  let va, vb;

  if (key === "summary") {
    va = (a.summary || "").toLowerCase();
    vb = (b.summary || "").toLowerCase();
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  }

  if (key === "score") {
    va = computeScore(a.scores, weights);
    vb = computeScore(b.scores, weights);
  } else {
    va = a.scores[key] || 5;
    vb = b.scores[key] || 5;
  }

  return dir === "asc" ? va - vb : vb - va;
}

/**
 * Update the footer task count.
 */
export function updateFooter(card) {
  const el = card.shadowRoot.getElementById("pm-count");
  if (!el) return;
  const count = card._tasks.size;
  el.textContent = `${count} task${count !== 1 ? "s" : ""}`;
}

/**
 * Fetch items from the todo entity and patch the DOM.
 */
export async function fetchItems(card) {
  if (!card._hass || !card._config) return;

  const gen = ++card._fetchGen;

  try {
    const resp = await card._hass.connection.sendMessagePromise({
      type: "call_service",
      domain: "todo",
      service: "get_items",
      service_data: { status: ["needs_action", "completed"] },
      target: { entity_id: card._config.entity },
      return_response: true,
    });

    if (gen !== card._fetchGen) return;

    const raw = resp.response?.[card._config.entity]?.items || [];
    patchTasks(card, raw);
  } catch (e) {
    console.warn("[priority-matrix-card] Failed to fetch items:", e);
  }
}

/**
 * Diff incoming server items against current state and surgically update DOM.
 */
function patchTasks(card, serverItems) {
  const container = card.shadowRoot.getElementById("pm-tasks");
  if (!container) return;

  const incoming = new Map();
  for (const item of serverItems) {
    if (!item.uid) continue;
    if (item.status === "completed") continue;
    incoming.set(item.uid, {
      uid: item.uid,
      summary: item.summary,
      scores: parseScores(item.description),
    });
  }

  // Snapshot positions of existing rows before any DOM changes
  const snapshots = [];
  container.querySelectorAll(".pm-row").forEach(el => {
    if (incoming.has(el.dataset.uid)) {
      snapshots.push({ el, top: el.getBoundingClientRect().top });
    }
  });

  // Remove rows no longer in server set
  for (const [uid] of card._tasks) {
    if (!incoming.has(uid)) {
      const row = container.querySelector(`.pm-row[data-uid="${uid}"]`);
      if (row) row.remove();
    }
  }

  // Update existing / create new
  const newUids = [];
  for (const [uid, task] of incoming) {
    const existing = card._tasks.get(uid);
    if (existing) {
      // Update summary if changed externally
      if (existing.summary !== task.summary) {
        const nameInput = container.querySelector(`.ui-input__field[data-uid="${uid}"]`);
        if (nameInput && nameInput !== card.shadowRoot.activeElement) {
          nameInput.value = task.summary;
          const pill = nameInput.closest(".ui-input__pill");
          if (pill) pill.classList.toggle("has-value", task.summary.length > 0);
        }
        existing.summary = task.summary;
      }
      // Update scores if changed externally
      let scoresChanged = false;
      for (const c of CRITERIA) {
        if (existing.scores[c.key] !== task.scores[c.key]) {
          existing.scores[c.key] = task.scores[c.key];
          scoresChanged = true;
          const slider = container.querySelector(`ui-circle-slider[data-uid="${uid}"][data-key="${c.key}"]`);
          if (slider) slider.value = task.scores[c.key];
        }
      }
      if (scoresChanged) {
        const score = computeScore(existing.scores, card._weights);
        const pill = container.querySelector(`.pm-score[data-uid="${uid}"]`);
        if (pill) updateScorePill(pill, score);
      }
    } else {
      // New task — create row
      const row = createTaskRow(task, card._weights);
      if (card._initialLoadDone) {
        row.classList.add("pm-row--new");
        row.addEventListener("animationend", () => {
          row.classList.remove("pm-row--new");
          row.style.borderColor = "var(--ui-pink)";
          requestAnimationFrame(() => {
            row.classList.add("pm-row--new-fade");
            requestAnimationFrame(() => {
              row.style.borderColor = "";
            });
          });
        }, { once: true });
      }
      container.appendChild(row);
      newUids.push(uid);
    }
  }

  card._initialLoadDone = true;
  card._tasks = incoming;
  updateFooter(card);

  // Apply current sort (reorders DOM + FLIP built in)
  if (card._sortKey) {
    sortAndReorder(card);
    updateSortIndicators(card.shadowRoot, card._sortKey, card._sortDir);
  } else {
    // No sort active — FLIP from pre-change snapshots
    flipRows(snapshots);
  }

  // Entry-animate new rows
  let entryIndex = 0;
  for (const uid of newUids) {
    const row = container.querySelector(`.pm-row[data-uid="${uid}"]`);
    if (row) animateRowEntry(row, entryIndex++);
  }
}


/* ── Debounced re-sort on score change ────────────────────────────────── */

let sortTimer = null;

function scheduleSortIfNeeded(card, key) {
  if (card._sortKey !== key && card._sortKey !== "score") return;
  if (sortTimer) clearTimeout(sortTimer);
  sortTimer = setTimeout(() => {
    sortTimer = null;
    sortAndReorder(card);
  }, 300);
}


/* ── Row animations ──────────────────────────────────────────────────── */

/**
 * FLIP animation: smoothly slide rows from old to new positions.
 * @param {Array<{el, top}>} snapshots - pre-move positions
 */
function flipRows(snapshots) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Cancel only FLIP (transform) animations — preserve CSS border pulse animations
  for (const { el } of snapshots) {
    el.getAnimations().forEach(a => {
      if (a instanceof CSSAnimation) return; // keep CSS keyframe animations (e.g. attention pulse)
      a.cancel();
    });
  }

  const upGroup = [];
  const downGroup = [];

  for (const { el, top } of snapshots) {
    if (!el.parentNode) continue;
    const newTop = el.getBoundingClientRect().top;
    const delta = top - newTop;
    if (Math.abs(delta) < 1) continue;

    if (delta > 0) {
      upGroup.push({ el, delta });
    } else {
      downGroup.push({ el, delta });
    }
  }

  upGroup.forEach(({ el, delta }, i) => {
    el.animate([
      { transform: `translateY(${delta}px)` },
      { transform: "translateY(0)" },
    ], { duration: 450, easing: "ease-in-out", delay: i * 50, fill: "backwards" });
  });

  downGroup.reverse();
  downGroup.forEach(({ el, delta }, i) => {
    el.animate([
      { transform: `translateY(${delta}px)` },
      { transform: "translateY(0)" },
    ], { duration: 450, easing: "ease-in-out", delay: i * 50, fill: "backwards" });
  });
}

/**
 * Animate a new row entering: fade in + slide up.
 * @param {HTMLElement} row
 * @param {number} index - stagger index
 */
function animateRowEntry(row, index) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  row.animate([
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], {
    duration: 350,
    easing: "ease-in-out",
    delay: index * 40,
    fill: "backwards",
  });
}
