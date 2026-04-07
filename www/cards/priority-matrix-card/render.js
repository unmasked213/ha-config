// /config/www/cards/priority-matrix-card/render.js
// DOM construction using shared UI components

import { CRITERIA, computeScore } from "./constants.js";

const SVG_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const SVG_WEIGHT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v17M5.5 8l13 0M3 12l18 0M5.5 16l13 0"/></svg>';
const SVG_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

/**
 * Build the full card DOM structure.
 * @param {ShadowRoot} root
 * @param {Object} config
 * @returns {{ card, tasksContainer, footerCount, weightsPanel }}
 */
export function buildCard(root, config) {
  root.innerHTML = "";

  const card = document.createElement("div");
  card.className = "pm-card";

  // ── Header (spec §6.18 pattern)
  const header = document.createElement("div");
  header.className = "ui-card-header";

  const accent = document.createElement("div");
  accent.className = "ui-card-header__accent";

  const title = document.createElement("h2");
  title.className = "ui-card-header__title";
  title.textContent = config.title || "HA priority matrix";

  const infoIcon = document.createElement("ui-info-icon");
  infoIcon.setAttribute("position", "bottom");
  infoIcon.tooltipContent = {
    title: "How scoring works",
    intro: "Each task is scored across six criteria (1–3). The composite score (0–100) reflects overall priority.",
    items: [
      { term: "Time", desc: "How soon this needs doing. 3 = urgent, 1 = no rush." },
      { term: "Function", desc: "How important this is for things to work properly. 3 = critical, 1 = nice-to-have." },
      { term: "Blocking", desc: "Whether other tasks depend on this. 3 = major blocker, 1 = standalone." },
      { term: "Impact", desc: "How much the system improves when done. 3 = transformative, 1 = minor polish." },
      { term: "Motivation", desc: "How likely you are to actually start this. 3 = excited to do it, 1 = avoiding it." },
      { term: "Size", desc: "How big the task is. Inverted: 3 = massive effort (scores lower), 1 = quick win (scores higher)." },
      { term: "Weights", desc: "Open the weights drawer (cog icon) to adjust how much each criterion matters. 0 = ignored, 3 = triple weight." },
    ],
  };

  header.append(accent, title, infoIcon);

  // ── Column headers
  const colHeaders = buildColumnHeaders();

  // ── Drawer (weights settings)
  const backdrop = document.createElement("div");
  backdrop.className = "ui-drawer-backdrop";

  const drawer = document.createElement("div");
  drawer.className = "ui-drawer";
  drawer.innerHTML = `
    <div class="ui-drawer__header">
      <h3 class="ui-drawer__title">Weights</h3>
      <ui-info-icon position="bottom"></ui-info-icon>
      <button class="ui-drawer__close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="ui-drawer__content" id="pm-weights"></div>`;

  // Wire drawer info icon tooltip
  const drawerInfo = drawer.querySelector("ui-info-icon");
  if (drawerInfo) {
    drawerInfo.tooltipContent = {
      title: "Weight settings",
      intro: "Weights control how much each criterion contributes to the final score. Higher weight = more influence.",
      items: [
        { term: "0", desc: "Criterion is ignored entirely — has no effect on the score." },
        { term: "0.5–1", desc: "Low to normal influence. Default is 1 for all criteria." },
        { term: "1.5–2", desc: "Elevated importance — this criterion matters more than others." },
        { term: "2.5–3", desc: "Dominant factor — this criterion heavily drives the final score." },
      ],
    };
  }

  // Populate drawer content with weight steppers
  const drawerContent = drawer.querySelector("#pm-weights");
  buildWeightsContent(drawerContent, config);

  // ── FAB trigger for drawer
  const fab = document.createElement("button");
  fab.className = "ui-fab ui-fab--small ui-drawer-toggle";
  fab.id = "pm-drawer-fab";
  fab.setAttribute("aria-label", "Weights");
  fab.innerHTML = SVG_WEIGHT;

  // ── Tasks container
  const tasksContainer = document.createElement("div");
  tasksContainer.className = "pm-tasks";
  tasksContainer.id = "pm-tasks";

  // ── Add task row (inline input)
  const addRow = document.createElement("div");
  addRow.className = "pm-add-row";

  const addInput = document.createElement("div");
  addInput.className = "ui-input";

  const addPill = document.createElement("div");
  addPill.className = "ui-input__pill";

  const addLabel = document.createElement("label");
  addLabel.className = "ui-input__label";
  addLabel.textContent = "Add new task...";

  const addField = document.createElement("input");
  addField.type = "text";
  addField.className = "ui-input__field";
  addField.id = "pm-add-field";
  addField.placeholder = " ";

  addPill.append(addLabel, addField);
  addInput.appendChild(addPill);
  addRow.appendChild(addInput);

  // ── Footer
  const footer = document.createElement("div");
  footer.className = "pm-footer";
  const footerCount = document.createElement("span");
  footerCount.id = "pm-count";
  footerCount.textContent = "0 tasks";
  footer.appendChild(footerCount);

  card.append(fab, backdrop, drawer, header, colHeaders, tasksContainer, addRow, footer);
  root.appendChild(card);

  return { card, tasksContainer, footerCount };
}

/**
 * Populate a container with weight stepper rows for the drawer.
 */
function buildWeightsContent(container, config) {
  const group = document.createElement("div");
  group.className = "ui-drawer__group";

  for (const c of CRITERIA) {
    const row = document.createElement("div");
    row.className = "ui-drawer__row";

    const label = document.createElement("span");
    label.className = "ui-drawer__label";
    label.textContent = c.label;

    const stepper = document.createElement("ui-number-input");
    stepper.setAttribute("min", "0");
    stepper.setAttribute("max", "3");
    stepper.setAttribute("step", "0.5");
    stepper.setAttribute("aria-label", `${c.label} weight`);
    const w = config.weights?.[c.key] ?? 1.0;
    stepper.setAttribute("value", String(w));
    stepper.dataset.key = c.key;

    row.append(label, stepper);
    group.appendChild(row);
  }

  container.appendChild(group);
}

/**
 * Build sortable column headers.
 */
function buildColumnHeaders() {
  const row = document.createElement("div");
  row.className = "pm-row-layout pm-col-headers";
  row.id = "pm-col-headers";

  // Task name header
  const nameHeader = document.createElement("div");
  nameHeader.className = "pm-row-layout__name pm-col-header";
  nameHeader.dataset.sort = "summary";
  nameHeader.innerHTML = 'Task<span class="pm-col-header__arrow"></span>';
  row.appendChild(nameHeader);

  // Slider headers — same flex container as the row's sliders
  const slidersWrap = document.createElement("div");
  slidersWrap.className = "pm-row-layout__sliders";
  for (const c of CRITERIA) {
    const el = document.createElement("div");
    el.className = "pm-col-header";
    el.dataset.sort = c.key;
    el.innerHTML = `${c.shortLabel}<span class="pm-col-header__arrow"></span>`;
    slidersWrap.appendChild(el);
  }
  row.appendChild(slidersWrap);

  // Score header
  const scoreHeader = document.createElement("div");
  scoreHeader.className = "pm-row-layout__score pm-col-header";
  scoreHeader.dataset.sort = "score";
  scoreHeader.innerHTML = 'Score<span class="pm-col-header__arrow"></span>';
  row.appendChild(scoreHeader);

  // Delete placeholder
  const deleteHeader = document.createElement("div");
  deleteHeader.className = "pm-row-layout__delete";
  row.appendChild(deleteHeader);

  return row;
}

/**
 * Create a single task row element.
 * Uses <ui-circle-slider> web components for scoring and .ui-btn--icon for delete.
 * @param {Object} task - { uid, summary, scores }
 * @param {Object} weights
 * @returns {HTMLElement}
 */
export function createTaskRow(task, weights) {
  const score = computeScore(task.scores, weights);

  const row = document.createElement("div");
  row.className = "pm-row-layout pm-row";
  row.dataset.uid = task.uid;

  // ── Name input (shared .ui-input component)
  const nameWrap = document.createElement("div");
  nameWrap.className = "pm-row-layout__name ui-input ui-input--quiet";

  const namePill = document.createElement("div");
  namePill.className = `ui-input__pill${task.summary ? " has-value" : ""}`;

  const nameLabel = document.createElement("label");
  nameLabel.className = "ui-input__label";
  nameLabel.textContent = "Task name";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "ui-input__field";
  nameInput.value = task.summary;
  nameInput.placeholder = " ";
  nameInput.dataset.uid = task.uid;

  namePill.append(nameLabel, nameInput);
  nameWrap.appendChild(namePill);

  // ── Sliders
  const slidersWrap = document.createElement("div");
  slidersWrap.className = "pm-row-layout__sliders";

  for (const c of CRITERIA) {
    const slider = document.createElement("ui-circle-slider");
    slider.setAttribute("value", String(task.scores[c.key] || 2));
    slider.setAttribute("min", "1");
    slider.setAttribute("max", "3");
    slider.setAttribute("step", "1");
    slider.setAttribute("size", "64");
    slider.setAttribute("unit", "");
    slider.setAttribute("label", `${c.label} score`);
    slider.setAttribute("type", "interactive");
    slider.dataset.uid = task.uid;
    slider.dataset.key = c.key;
    applySliderFillColor(slider, task.scores[c.key] || 5);

    slidersWrap.appendChild(slider);
  }

  // ── Score badge
  const scoreWrap = document.createElement("div");
  scoreWrap.className = "pm-row-layout__score";
  const scorePill = document.createElement("span");
  scorePill.className = "pm-score";
  scorePill.dataset.uid = task.uid;
  scorePill.textContent = score;
  scoreWrap.appendChild(scorePill);

  // ── Delete button
  const deleteWrap = document.createElement("div");
  deleteWrap.className = "pm-row-layout__delete";
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "ui-btn ui-btn--icon ui-btn--small";
  deleteBtn.dataset.uid = task.uid;
  deleteBtn.setAttribute("aria-label", "Delete task");
  deleteBtn.innerHTML = SVG_X;
  deleteWrap.appendChild(deleteBtn);

  row.append(nameWrap, slidersWrap, scoreWrap, deleteWrap);

  return row;
}

/**
 * Set --ui-circle-fill on a slider based on value severity.
 * @param {HTMLElement} slider - The <ui-circle-slider> element
 * @param {number} value - 1-10
 */
export function applySliderFillColor() {
  // Uniform accent colour — no value-based colouring
}

/**
 * Update a score pill's visual state.
 * @param {HTMLElement} pill
 * @param {number} score
 */
export function updateScorePill(pill, score) {
  pill.textContent = score;
}

/**
 * Update the sort indicator on column headers.
 * @param {ShadowRoot} root
 * @param {string} sortKey
 * @param {string} sortDir - "asc" or "desc"
 */
export function updateSortIndicators(root, sortKey, sortDir) {
  const headers = root.querySelectorAll(".pm-col-header[data-sort]");
  for (const h of headers) {
    const arrow = h.querySelector(".pm-col-header__arrow");
    if (h.dataset.sort === sortKey) {
      h.classList.add("is-sorted");
      if (arrow) arrow.textContent = sortDir === "asc" ? " \u25B2" : " \u25BC";
    } else {
      h.classList.remove("is-sorted");
      if (arrow) arrow.textContent = "";
    }
  }
}
