import { getTodayIso, shiftIsoDate } from './core.js';

function makeId() {
  return `pp-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlankProposal(defaults = {}) {
  const today = defaults.today || getTodayIso();

  return {
    id: makeId(),
    clientName: '',
    projectName: '',
    amount: 0,
    currency: 'USD',
    status: 'draft',
    stage: 'drafting',
    sentDate: today,
    expiryDate: shiftIsoDate(today, 7),
    lastContactDate: today,
    followUpGapDays: defaults.followUpGapDays || 4,
    blockers: '',
    notes: '',
  };
}

export function createSampleData(today = getTodayIso()) {
  return {
    proposals: [
      {
        id: makeId(),
        clientName: 'Studio Namu',
        projectName: 'Brand site refresh',
        amount: 3200,
        currency: 'USD',
        status: 'sent',
        stage: 'decision_pending',
        sentDate: shiftIsoDate(today, -8),
        expiryDate: shiftIsoDate(today, 5),
        lastContactDate: shiftIsoDate(today, -5),
        followUpGapDays: 4,
        blockers: 'Waiting for internal approval from the founder.',
        notes: 'They liked the case studies and asked for a lighter launch scope.',
      },
      {
        id: makeId(),
        clientName: 'Pine & Co',
        projectName: 'Newsletter sales funnel',
        amount: 1800,
        currency: 'USD',
        status: 'follow_up',
        stage: 'awaiting_reply',
        sentDate: shiftIsoDate(today, -12),
        expiryDate: shiftIsoDate(today, 2),
        lastContactDate: shiftIsoDate(today, -4),
        followUpGapDays: 3,
        blockers: 'Copy team wants one more proof sample.',
        notes: 'High-fit project, but their internal team is moving slowly.',
      },
      {
        id: makeId(),
        clientName: 'Orbit Foods',
        projectName: 'Product launch scripts',
        amount: 5400,
        currency: 'USD',
        status: 'negotiation',
        stage: 'contract',
        sentDate: shiftIsoDate(today, -6),
        expiryDate: shiftIsoDate(today, 9),
        lastContactDate: shiftIsoDate(today, -1),
        followUpGapDays: 4,
        blockers: 'Procurement needs a revised milestone payment schedule.',
        notes: 'Call went well. Final decision likely after finance confirms the timeline.',
      },
    ],
    settings: {
      defaultFollowUpGapDays: 4,
      preferredTemplate: 'gentle',
    },
  };
}
