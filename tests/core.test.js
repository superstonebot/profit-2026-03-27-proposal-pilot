import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectInitialLocale,
  createNextActionSuggestion,
  calculateCloseProbability,
  buildReminderMessage,
  exportProposalMarkdown,
} from '../src/core.js';

test('detectInitialLocale prefers saved locale before browser locale', () => {
  assert.equal(detectInitialLocale('en', 'ko-KR'), 'en');
  assert.equal(detectInitialLocale('', 'ko-KR'), 'ko');
  assert.equal(detectInitialLocale(null, 'en-US'), 'en');
});

test('createNextActionSuggestion marks overdue proposals for gentle follow-up', () => {
  const result = createNextActionSuggestion({
    status: 'sent',
    stage: 'awaiting_reply',
    sentDate: '2026-03-18',
    lastContactDate: '2026-03-18',
    expiryDate: '2026-04-02',
    followUpGapDays: 4,
  }, '2026-03-26');

  assert.equal(result.urgency, 'due');
  assert.equal(result.recommendedTemplate, 'gentle');
  assert.match(result.headline, /Follow up today/i);
});

test('calculateCloseProbability lowers score when blockers exist and expiry is near', () => {
  const result = calculateCloseProbability({
    status: 'sent',
    stage: 'decision_pending',
    blockers: 'Budget approved next month. Legal review pending.',
    expiryDate: '2026-03-28',
  }, '2026-03-26');

  assert.equal(result.percent, 56);
  assert.equal(result.label, 'watchlist');
});

test('buildReminderMessage generates bilingual-ready copy for final check-in', () => {
  const result = buildReminderMessage('final', {
    locale: 'en',
    clientName: 'Mina',
    projectName: 'Quarterly launch copy',
    amount: 1800,
    currency: 'USD',
    expiryDate: '2026-03-28',
  });

  assert.match(result, /final check-in/i);
  assert.match(result, /Quarterly launch copy/);
  assert.match(result, /USD 1,800/);
});

test('exportProposalMarkdown includes summary, next step, and blockers', () => {
  const markdown = exportProposalMarkdown({
    clientName: 'Studio Namu',
    projectName: 'Website refresh',
    amount: 3200,
    currency: 'USD',
    status: 'sent',
    stage: 'decision_pending',
    sentDate: '2026-03-20',
    expiryDate: '2026-03-31',
    blockers: 'Waiting for internal approval',
    notes: 'Loved the first concept call.',
  }, {
    headline: 'Follow up tomorrow',
    detail: 'Expiry is close enough to schedule a gentle nudge.',
  }, {
    percent: 68,
    label: 'warm',
  });

  assert.match(markdown, /^# Website refresh/m);
  assert.match(markdown, /- Status: sent/);
  assert.match(markdown, /- Close probability: 68% \(warm\)/);
  assert.match(markdown, /Waiting for internal approval/);
  assert.match(markdown, /Follow up tomorrow/);
});
