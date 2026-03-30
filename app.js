import {
  STATUS_OPTIONS,
  STAGE_OPTIONS,
  TEMPLATE_TYPES,
  detectInitialLocale,
  createNextActionSuggestion,
  calculateCloseProbability,
  buildReminderMessage,
  exportProposalMarkdown,
  formatCurrency,
  formatCurrencyCompact,
  daysBetween,
  getTodayIso,
} from './src/core.js';
import { createBlankProposal, createSampleData } from './src/sample-data.js';
import { t, statusLabel, stageLabel, templateLabel } from './src/i18n.js';

const STORAGE_KEY = 'proposal-pilot-state-v1';
const HISTORY_LIMIT = 18;

const state = loadState();
const root = document.querySelector('#app');
const toast = document.querySelector('#toast');

function loadState() {
  const browserLocale = navigator.language || 'en';
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const locale = detectInitialLocale(null, browserLocale);
    return createInitialState(locale);
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeState(parsed, browserLocale);
  } catch {
    const locale = detectInitialLocale(null, browserLocale);
    return createInitialState(locale);
  }
}

function createInitialState(locale) {
  const blank = createBlankProposal({ today: getTodayIso(), followUpGapDays: 4 });

  return {
    proposals: [blank],
    selectedProposalId: blank.id,
    settings: {
      locale,
      defaultFollowUpGapDays: 4,
      preferredTemplate: 'gentle',
    },
    history: [],
    ui: {
      activeTemplate: 'gentle',
    },
  };
}

function normalizeState(parsed, browserLocale) {
  const locale = detectInitialLocale(parsed?.settings?.locale, browserLocale);
  const defaultGap = Number(parsed?.settings?.defaultFollowUpGapDays) || 4;
  const proposals = Array.isArray(parsed?.proposals) && parsed.proposals.length
    ? parsed.proposals.map((proposal) => ({
        ...createBlankProposal({ today: proposal.sentDate || getTodayIso(), followUpGapDays: defaultGap }),
        ...proposal,
        followUpGapDays: Number(proposal.followUpGapDays) || defaultGap,
      }))
    : [createBlankProposal({ today: getTodayIso(), followUpGapDays: defaultGap })];

  const selectedExists = proposals.some((proposal) => proposal.id === parsed?.selectedProposalId);

  return {
    proposals,
    selectedProposalId: selectedExists ? parsed.selectedProposalId : proposals[0].id,
    settings: {
      locale,
      defaultFollowUpGapDays: defaultGap,
      preferredTemplate: TEMPLATE_TYPES.includes(parsed?.settings?.preferredTemplate)
        ? parsed.settings.preferredTemplate
        : 'gentle',
    },
    history: Array.isArray(parsed?.history) ? parsed.history.slice(0, HISTORY_LIMIT) : [],
    ui: {
      activeTemplate: TEMPLATE_TYPES.includes(parsed?.ui?.activeTemplate)
        ? parsed.ui.activeTemplate
        : TEMPLATE_TYPES.includes(parsed?.settings?.preferredTemplate)
          ? parsed.settings.preferredTemplate
          : 'gentle',
    },
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLocale() {
  return state.settings.locale;
}

function getSelectedProposal() {
  return state.proposals.find((proposal) => proposal.id === state.selectedProposalId) || state.proposals[0] || null;
}

function addHistory(messageKeyOrText, options = {}) {
  const locale = getLocale();
  const entry = {
    id: `hist-${makeId()}`,
    label: options.raw ? messageKeyOrText : t(locale, messageKeyOrText),
    at: new Date().toISOString(),
  };

  state.history = [entry, ...state.history].slice(0, HISTORY_LIMIT);
}

function showToastMessage(messageKeyOrText, options = {}) {
  toast.textContent = options.raw ? messageKeyOrText : t(getLocale(), messageKeyOrText);
  toast.classList.add('is-visible');
  clearTimeout(showToastMessage.timer);
  showToastMessage.timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1800);
}

function setLocale(locale) {
  if (!['ko', 'en'].includes(locale) || locale === getLocale()) return;
  state.settings.locale = locale;
  saveState();
  render();
  showToastMessage('localeChanged');
}

function setActiveTemplate(template) {
  if (!TEMPLATE_TYPES.includes(template)) return;
  state.ui.activeTemplate = template;
  saveState();
  render();
}

function selectProposal(id) {
  if (!state.proposals.some((proposal) => proposal.id === id)) return;
  state.selectedProposalId = id;
  saveState();
  render();
}

function createNewProposal() {
  const blank = createBlankProposal({
    today: getTodayIso(),
    followUpGapDays: state.settings.defaultFollowUpGapDays,
  });

  state.proposals = [blank, ...state.proposals];
  state.selectedProposalId = blank.id;
  addHistory('createdBlank');
  saveState();
  render();
  showToastMessage('createdBlank');
}

function loadSampleDesk() {
  const sample = createSampleData(getTodayIso());
  state.proposals = sample.proposals;
  state.selectedProposalId = sample.proposals[0].id;
  state.settings.defaultFollowUpGapDays = sample.settings.defaultFollowUpGapDays;
  state.settings.preferredTemplate = sample.settings.preferredTemplate;
  state.ui.activeTemplate = sample.settings.preferredTemplate;
  addHistory('loadedSample');
  saveState();
  render();
  showToastMessage('loadedSample');
}

function resetDesk() {
  const fresh = createInitialState(getLocale());
  state.proposals = fresh.proposals;
  state.selectedProposalId = fresh.selectedProposalId;
  state.settings.defaultFollowUpGapDays = fresh.settings.defaultFollowUpGapDays;
  state.settings.preferredTemplate = fresh.settings.preferredTemplate;
  state.ui.activeTemplate = fresh.ui.activeTemplate;
  state.history = [];
  addHistory('resetDone');
  saveState();
  render();
  showToastMessage('resetDone');
}

function updateProposalField(field, value) {
  const proposal = getSelectedProposal();
  if (!proposal) return;

  const parsedValue = ['amount', 'followUpGapDays'].includes(field) ? Number(value) || 0 : value;
  proposal[field] = parsedValue;

  if (field === 'status' && value === 'won') proposal.stage = 'closed';
  if (field === 'status' && value === 'lost') proposal.stage = 'closed';

  saveState();
  render();
}

function updateSetting(field, value) {
  if (field === 'defaultFollowUpGapDays') {
    state.settings.defaultFollowUpGapDays = Number(value) || 4;
  } else if (field === 'preferredTemplate' && TEMPLATE_TYPES.includes(value)) {
    state.settings.preferredTemplate = value;
    state.ui.activeTemplate = value;
  }

  addHistory('savedSettings');
  saveState();
  render();
  showToastMessage('savedSettings');
}

function markFollowUpToday() {
  const proposal = getSelectedProposal();
  if (!proposal) return;

  proposal.lastContactDate = getTodayIso();
  if (proposal.status === 'sent') proposal.status = 'follow_up';
  addHistory('followUpLogged');
  saveState();
  render();
  showToastMessage('followUpLogged');
}

async function copyReminder() {
  const proposal = getSelectedProposal();
  if (!proposal) return;

  const reminder = getReminderText(proposal);

  try {
    await navigator.clipboard.writeText(reminder);
  } catch {
    const helper = document.createElement('textarea');
    helper.value = reminder;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }

  addHistory('copied');
  saveState();
  showToastMessage('copied');
}

function exportCurrentProposal(kind) {
  const proposal = getSelectedProposal();
  if (!proposal) return;

  const nextAction = createNextActionSuggestion(proposal, getTodayIso(), getLocale());
  const probability = calculateCloseProbability(proposal, getTodayIso(), getLocale());
  const slug = slugify(`${proposal.clientName || 'client'}-${proposal.projectName || 'proposal'}`);

  if (kind === 'markdown') {
    const content = exportProposalMarkdown(proposal, nextAction, probability);
    downloadFile(`${slug}.md`, content, 'text/markdown;charset=utf-8');
    addHistory('exportedMd');
    showToastMessage('exportedMd');
  }

  if (kind === 'json') {
    const content = JSON.stringify({ proposal, nextAction, probability }, null, 2);
    downloadFile(`${slug}.json`, content, 'application/json;charset=utf-8');
    addHistory('exportedJson');
    showToastMessage('exportedJson');
  }

  saveState();
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'proposal';
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

function getReminderText(proposal) {
  return buildReminderMessage(state.ui.activeTemplate, {
    locale: getLocale(),
    clientName: proposal.clientName || t(getLocale(), 'noClient'),
    projectName: proposal.projectName || t(getLocale(), 'noProject'),
    amount: proposal.amount,
    currency: proposal.currency,
    expiryDate: proposal.expiryDate,
  });
}

function render() {
  const locale = getLocale();
  document.documentElement.lang = locale;
  const proposal = getSelectedProposal();
  const stats = getDashboardStats();

  root.innerHTML = `
    <section class="shell-top">
      <div class="brand-block">
        <p class="eyebrow">${escapeHtml(t(locale, 'appTitle'))}</p>
        <h1>${escapeHtml(t(locale, 'appSubtitle'))}</h1>
        <p class="muted">${escapeHtml(t(locale, 'localOnly'))}</p>
      </div>
      <div class="top-actions">
        <div class="lang-toggle" aria-label="Language toggle">
          ${renderLanguageButton('ko', locale)}
          ${renderLanguageButton('en', locale)}
        </div>
        <button class="ghost-btn" data-action="reset-data">${escapeHtml(t(locale, 'resetData'))}</button>
      </div>
    </section>

    <section class="shell-grid">
      <aside class="panel panel-left">
        <div class="card masthead-card">
          <div>
            <h2>${escapeHtml(t(locale, 'pipelineBoard'))}</h2>
            <p class="muted">${escapeHtml(t(locale, 'yourDesk'))}</p>
          </div>
          <div class="stack-actions">
            <button class="primary-btn" data-action="new-proposal">${escapeHtml(t(locale, 'newProposal'))}</button>
            <button class="secondary-btn" data-action="load-sample">${escapeHtml(t(locale, 'sampleData'))}</button>
          </div>
        </div>

        <div class="stats-grid">
          ${renderStatCard(t(locale, 'openDeals'), String(stats.openDeals))}
          ${renderStatCard(t(locale, 'needsAction'), String(stats.needsAction))}
          ${renderStatCard(t(locale, 'pipelineValue'), formatCurrencyCompact(stats.pipelineValue, 'USD'))}
          ${renderStatCard(t(locale, 'avgConfidence'), `${stats.avgConfidence}%`)}
        </div>

        <div class="card list-card">
          <div class="section-head">
            <h3>${escapeHtml(t(locale, 'workspace'))}</h3>
            <span class="badge subtle">${state.proposals.length}</span>
          </div>
          <div class="proposal-list">
            ${state.proposals.length ? state.proposals.map((item) => renderProposalCard(item, locale)).join('') : `<p class="empty-copy">${escapeHtml(t(locale, 'emptyList'))}</p>`}
          </div>
        </div>
      </aside>

      <main class="panel panel-main">
        ${proposal ? renderWorkspace(proposal, locale) : `<div class="card workspace-empty">${escapeHtml(t(locale, 'emptyWorkspace'))}</div>`}
      </main>

      <aside class="panel panel-right">
        <div class="card history-card">
          <div class="section-head">
            <h3>${escapeHtml(t(locale, 'history'))}</h3>
            <span class="badge subtle">${state.history.length}</span>
          </div>
          <div class="history-list">
            ${state.history.length ? state.history.map((entry) => renderHistoryEntry(entry, locale)).join('') : `<p class="empty-copy">${escapeHtml(t(locale, 'historyEmpty'))}</p>`}
          </div>
        </div>

        <div class="card settings-card">
          <div class="section-head">
            <h3>${escapeHtml(t(locale, 'settings'))}</h3>
          </div>
          <label>
            <span>${escapeHtml(t(locale, 'defaultGap'))}</span>
            <input type="number" min="1" max="30" data-setting="defaultFollowUpGapDays" value="${state.settings.defaultFollowUpGapDays}" />
          </label>
          <label>
            <span>${escapeHtml(t(locale, 'preferredTemplate'))}</span>
            <select data-setting="preferredTemplate">
              ${TEMPLATE_TYPES.map((item) => `<option value="${item}" ${state.settings.preferredTemplate === item ? 'selected' : ''}>${escapeHtml(templateLabel(locale, item))}</option>`).join('')}
            </select>
          </label>
          <p class="footnote">${escapeHtml(t(locale, 'autoSaved'))}</p>
        </div>
      </aside>
    </section>
  `;
}

function renderLanguageButton(localeCode, currentLocale) {
  return `<button class="lang-btn ${currentLocale === localeCode ? 'is-active' : ''}" data-locale="${localeCode}">${localeCode.toUpperCase()}</button>`;
}

function renderStatCard(label, value) {
  return `
    <div class="card stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderProposalCard(proposal, locale) {
  const isActive = proposal.id === state.selectedProposalId;
  const nextAction = createNextActionSuggestion(proposal, getTodayIso(), locale);
  const probability = calculateCloseProbability(proposal, getTodayIso(), locale);

  return `
    <button class="proposal-card ${isActive ? 'is-active' : ''}" data-action="select-proposal" data-id="${proposal.id}">
      <div class="proposal-card__top">
        <div>
          <strong>${escapeHtml(proposal.clientName || t(locale, 'noClient'))}</strong>
          <p>${escapeHtml(proposal.projectName || t(locale, 'noProject'))}</p>
        </div>
        <span class="badge ${nextAction.urgency}">${escapeHtml(t(locale, `urgency_${nextAction.urgency}`))}</span>
      </div>
      <div class="proposal-card__meta">
        <span>${escapeHtml(statusLabel(locale, proposal.status))}</span>
        <span>${escapeHtml(formatCurrencyCompact(proposal.amount, proposal.currency || 'USD'))}</span>
        <span>${probability.percent}%</span>
      </div>
    </button>
  `;
}

function renderWorkspace(proposal, locale) {
  const nextAction = createNextActionSuggestion(proposal, getTodayIso(), locale);
  const probability = calculateCloseProbability(proposal, getTodayIso(), locale);
  const reminder = getReminderText(proposal);
  const expiryDelta = proposal.expiryDate ? daysBetween(getTodayIso(), proposal.expiryDate) : null;

  return `
    <div class="card workspace-card">
      <div class="workspace-head">
        <div>
          <p class="eyebrow">${escapeHtml(t(locale, 'workspace'))}</p>
          <h2>${escapeHtml(proposal.projectName || t(locale, 'noProject'))}</h2>
          <p class="muted">${escapeHtml(proposal.clientName || t(locale, 'noClient'))}</p>
        </div>
        <div class="inline-actions">
          <button class="secondary-btn" data-action="export-markdown">${escapeHtml(t(locale, 'exportMd'))}</button>
          <button class="secondary-btn" data-action="export-json">${escapeHtml(t(locale, 'exportJson'))}</button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card accent">
          <span>${escapeHtml(t(locale, 'closeProbability'))}</span>
          <strong>${probability.percent}%</strong>
          <p>${escapeHtml(probability.narrative)}</p>
        </div>
        <div class="summary-card">
          <span>${escapeHtml(t(locale, 'nextMove'))}</span>
          <strong>${escapeHtml(nextAction.headline)}</strong>
          <p>${escapeHtml(nextAction.detail)}</p>
        </div>
        <div class="summary-card">
          <span>${escapeHtml(t(locale, 'dueBy'))}</span>
          <strong>${expiryDelta === null ? '—' : `${expiryDelta}d`}</strong>
          <p>${proposal.expiryDate ? escapeHtml(proposal.expiryDate) : '—'}</p>
        </div>
      </div>

      <div class="workspace-columns">
        <section class="detail-card">
          <div class="section-head">
            <h3>${escapeHtml(t(locale, 'details'))}</h3>
          </div>
          <div class="form-grid">
            ${renderTextField(locale, 'clientName', proposal.clientName)}
            ${renderTextField(locale, 'projectName', proposal.projectName)}
            ${renderNumberField(locale, 'amount', proposal.amount)}
            ${renderSelectField(locale, 'currency', proposal.currency, ['USD', 'KRW', 'EUR'])}
            ${renderSelectField(locale, 'status', proposal.status, STATUS_OPTIONS, (value) => statusLabel(locale, value))}
            ${renderSelectField(locale, 'stage', proposal.stage, STAGE_OPTIONS, (value) => stageLabel(locale, value))}
            ${renderDateField(locale, 'sentDate', proposal.sentDate)}
            ${renderDateField(locale, 'expiryDate', proposal.expiryDate)}
            ${renderDateField(locale, 'lastContactDate', proposal.lastContactDate)}
            ${renderNumberField(locale, 'followUpGapDays', proposal.followUpGapDays)}
          </div>
          ${renderTextArea(locale, 'blockers', proposal.blockers)}
          ${renderTextArea(locale, 'notes', proposal.notes)}
        </section>

        <section class="stack-column">
          <div class="detail-card planner-card">
            <div class="section-head">
              <h3>${escapeHtml(t(locale, 'suggestion'))}</h3>
              <span class="badge ${nextAction.urgency}">${escapeHtml(t(locale, `urgency_${nextAction.urgency}`))}</span>
            </div>
            <h4>${escapeHtml(t(locale, 'recommendation'))}</h4>
            <p class="big-copy">${escapeHtml(nextAction.headline)}</p>
            <p class="muted">${escapeHtml(nextAction.detail)}</p>
            <button class="primary-btn compact" data-action="mark-follow-up">${escapeHtml(t(locale, 'markFollowUp'))}</button>
          </div>

          <div class="detail-card reminder-card">
            <div class="section-head">
              <h3>${escapeHtml(t(locale, 'reminderLab'))}</h3>
            </div>
            <p class="muted">${escapeHtml(t(locale, 'reminderHint'))}</p>
            <div class="pill-row">
              ${TEMPLATE_TYPES.map((type) => `<button class="pill ${state.ui.activeTemplate === type ? 'is-active' : ''}" data-action="set-template" data-template="${type}">${escapeHtml(templateLabel(locale, type))}</button>`).join('')}
            </div>
            <textarea class="preview-box" readonly>${escapeHtml(reminder)}</textarea>
            <button class="secondary-btn compact" data-action="copy-reminder">${escapeHtml(t(locale, 'copyReminder'))}</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderTextField(locale, field, value) {
  return `
    <label>
      <span>${escapeHtml(t(locale, field))}</span>
      <input type="text" data-field="${field}" value="${escapeHtml(value || '')}" />
    </label>
  `;
}

function renderNumberField(locale, field, value) {
  return `
    <label>
      <span>${escapeHtml(t(locale, field))}</span>
      <input type="number" min="0" data-field="${field}" value="${escapeHtml(String(value ?? 0))}" />
    </label>
  `;
}

function renderDateField(locale, field, value) {
  return `
    <label>
      <span>${escapeHtml(t(locale, field))}</span>
      <input type="date" data-field="${field}" value="${escapeHtml(value || '')}" />
    </label>
  `;
}

function renderSelectField(locale, field, value, options, formatter = (item) => item) {
  return `
    <label>
      <span>${escapeHtml(t(locale, field))}</span>
      <select data-field="${field}">
        ${options.map((item) => `<option value="${item}" ${value === item ? 'selected' : ''}>${escapeHtml(formatter(item))}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderTextArea(locale, field, value) {
  return `
    <label class="textarea-wrap">
      <span>${escapeHtml(t(locale, field))}</span>
      <textarea data-field="${field}" rows="4">${escapeHtml(value || '')}</textarea>
    </label>
  `;
}

function renderHistoryEntry(entry, locale) {
  const timestamp = new Date(entry.at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <div class="history-entry">
      <strong>${escapeHtml(entry.label)}</strong>
      <span>${escapeHtml(timestamp)}</span>
    </div>
  `;
}

function getDashboardStats() {
  const openStatuses = new Set(['draft', 'sent', 'follow_up', 'negotiation']);
  const openDeals = state.proposals.filter((proposal) => openStatuses.has(proposal.status));
  const needsAction = openDeals.filter((proposal) => {
    const urgency = createNextActionSuggestion(proposal, getTodayIso(), getLocale()).urgency;
    return urgency === 'urgent' || urgency === 'due';
  }).length;
  const pipelineValue = openDeals.reduce((sum, proposal) => sum + (Number(proposal.amount) || 0), 0);
  const avgConfidence = openDeals.length
    ? Math.round(openDeals.reduce((sum, proposal) => sum + calculateCloseProbability(proposal, getTodayIso(), getLocale()).percent, 0) / openDeals.length)
    : 0;

  return { openDeals: openDeals.length, needsAction, pipelineValue, avgConfidence };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-locale]');
  if (!target) return;

  if (target.dataset.locale) {
    setLocale(target.dataset.locale);
    return;
  }

  switch (target.dataset.action) {
    case 'new-proposal':
      createNewProposal();
      break;
    case 'load-sample':
      loadSampleDesk();
      break;
    case 'reset-data':
      resetDesk();
      break;
    case 'select-proposal':
      selectProposal(target.dataset.id);
      break;
    case 'mark-follow-up':
      markFollowUpToday();
      break;
    case 'copy-reminder':
      copyReminder();
      break;
    case 'export-markdown':
      exportCurrentProposal('markdown');
      break;
    case 'export-json':
      exportCurrentProposal('json');
      break;
    case 'set-template':
      setActiveTemplate(target.dataset.template);
      break;
    default:
      break;
  }
});

document.addEventListener('change', (event) => {
  const fieldTarget = event.target.closest('[data-field]');
  if (fieldTarget) {
    updateProposalField(fieldTarget.dataset.field, fieldTarget.value);
    return;
  }

  const settingTarget = event.target.closest('[data-setting]');
  if (settingTarget) {
    updateSetting(settingTarget.dataset.setting, settingTarget.value);
  }
});

render();
