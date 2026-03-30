const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const STATUS_OPTIONS = ['draft', 'sent', 'follow_up', 'negotiation', 'won', 'lost'];
export const STAGE_OPTIONS = ['drafting', 'awaiting_reply', 'discovery', 'decision_pending', 'contract', 'closed'];
export const TEMPLATE_TYPES = ['gentle', 'firm', 'expiry', 'final'];

export function detectInitialLocale(savedLocale, browserLocale = 'en') {
  if (savedLocale === 'ko' || savedLocale === 'en') {
    return savedLocale;
  }

  return String(browserLocale).toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export function formatCurrency(amount = 0, currency = 'USD', locale = 'en') {
  const normalizedAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const resolvedLocale = locale === 'ko' ? 'ko-KR' : 'en-US';

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(normalizedAmount);
}

export function formatCurrencyCompact(amount = 0, currency = 'USD') {
  const normalizedAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `${currency} ${normalizedAmount.toLocaleString('en-US')}`;
}

export function daysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return null;

  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.round((end - start) / MS_PER_DAY);
}

export function createNextActionSuggestion(proposal, today = getTodayIso(), locale = 'en') {
  const followUpGapDays = Number(proposal.followUpGapDays) || 4;
  const daysSinceLastTouch = daysBetween(proposal.lastContactDate || proposal.sentDate, today);
  const daysUntilExpiry = proposal.expiryDate ? daysBetween(today, proposal.expiryDate) : null;
  const copy = locale === 'ko'
    ? {
        wonHeadline: '온도만 유지하세요',
        wonDetail: '이미 수주한 딜입니다. 이제는 온보딩과 관계 유지에 집중하세요.',
        lostHeadline: '정리하고 배움을 남기세요',
        lostDetail: '실주로 표시된 건입니다. 이유를 기록하고 추가 에너지는 아끼세요.',
        finalHeadline: '지금 마지막 확인이 필요합니다',
        finalDetail: '제안 유효기간이 지났거나 오늘까지입니다. 오늘 바로 마지막 확인 메시지를 보내세요.',
        expiryHeadline: '오늘 만료 전 확인이 좋습니다',
        expiryDetail: '48시간 안에 만료됩니다. 만료 중심 메시지로 빠르게 의사결정을 유도하세요.',
        dueHeadline: '오늘 팔로업 하세요',
        dueDetail: `${daysSinceLastTouch}일째 응답이 멈춰 있습니다. 부드러운 리마인더로 대화를 다시 살리기 좋습니다.`,
        soonHeadline: '내일 팔로업 예약이 좋습니다',
        soonDetail: '계획한 간격까지 하루 남았습니다. 오늘 문구를 준비하고 내일 보내세요.',
        holdHeadline: '지금은 조금 더 지켜봐도 됩니다',
        holdDetail: '현재 간격은 아직 건강합니다. 장애물만 체크하면서 다음 타이밍을 기다리세요.',
      }
    : {
        wonHeadline: 'Keep the momentum warm',
        wonDetail: 'You already won this deal. Shift into onboarding and relationship follow-through.',
        lostHeadline: 'Archive and learn',
        lostDetail: 'This one is marked lost. Capture the reason, then move on without spending more follow-up energy.',
        finalHeadline: 'Final check-in now',
        finalDetail: 'The proposal expiry date is here or passed. Send a final close-the-loop note today.',
        expiryHeadline: 'Expiry follow-up today',
        expiryDetail: 'The proposal expires within 48 hours. Use an expiry-focused reminder to create clarity.',
        dueHeadline: 'Follow up today',
        dueDetail: `It has been ${daysSinceLastTouch} days since the last touchpoint. A gentle nudge keeps the thread active without pressure.`,
        soonHeadline: 'Queue a follow-up for tomorrow',
        soonDetail: 'You are one day away from the planned follow-up cadence. Prepare the message now and send it tomorrow.',
        holdHeadline: 'Hold for now',
        holdDetail: 'The cadence still looks healthy. Keep monitoring blockers and wait before sending another follow-up.',
      };

  if (proposal.status === 'won') {
    return {
      urgency: 'stable',
      recommendedTemplate: 'gentle',
      headline: copy.wonHeadline,
      detail: copy.wonDetail,
      actionDate: today,
    };
  }

  if (proposal.status === 'lost') {
    return {
      urgency: 'stable',
      recommendedTemplate: 'final',
      headline: copy.lostHeadline,
      detail: copy.lostDetail,
      actionDate: today,
    };
  }

  if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
    return {
      urgency: 'urgent',
      recommendedTemplate: 'final',
      headline: copy.finalHeadline,
      detail: copy.finalDetail,
      actionDate: today,
    };
  }

  if (daysUntilExpiry !== null && daysUntilExpiry <= 2) {
    return {
      urgency: 'urgent',
      recommendedTemplate: 'expiry',
      headline: copy.expiryHeadline,
      detail: copy.expiryDetail,
      actionDate: today,
    };
  }

  if (daysSinceLastTouch !== null && daysSinceLastTouch >= followUpGapDays) {
    return {
      urgency: 'due',
      recommendedTemplate: 'gentle',
      headline: copy.dueHeadline,
      detail: copy.dueDetail,
      actionDate: today,
    };
  }

  if (daysSinceLastTouch !== null && daysSinceLastTouch === followUpGapDays - 1) {
    return {
      urgency: 'soon',
      recommendedTemplate: 'gentle',
      headline: copy.soonHeadline,
      detail: copy.soonDetail,
      actionDate: shiftIsoDate(today, 1),
    };
  }

  return {
    urgency: 'stable',
    recommendedTemplate: 'gentle',
    headline: copy.holdHeadline,
    detail: copy.holdDetail,
    actionDate: shiftIsoDate(today, Math.max(1, (followUpGapDays - (daysSinceLastTouch ?? 0)) || 1)),
  };
}

export function calculateCloseProbability(proposal, today = getTodayIso(), locale = 'en') {
  const statusWeights = {
    draft: 32,
    sent: 58,
    follow_up: 62,
    negotiation: 78,
    won: 100,
    lost: 6,
  };

  const stageWeights = {
    drafting: -10,
    awaiting_reply: 0,
    discovery: 6,
    decision_pending: 12,
    contract: 18,
    closed: 0,
  };

  let percent = statusWeights[proposal.status] ?? 50;
  percent += stageWeights[proposal.stage] ?? 0;

  const blockerText = String(proposal.blockers || '').trim();
  if (blockerText) {
    const blockerCount = blockerText.split(/[.!?\n]+/).map((item) => item.trim()).filter(Boolean).length;
    percent -= Math.min(16, blockerCount * 4);
  }

  const daysUntilExpiry = proposal.expiryDate ? daysBetween(today, proposal.expiryDate) : null;
  if (daysUntilExpiry !== null) {
    if (daysUntilExpiry <= 2) percent -= 6;
    else if (daysUntilExpiry <= 5) percent -= 3;
  }

  percent = Math.max(4, Math.min(100, percent));

  return {
    percent,
    label: probabilityLabel(percent),
    narrative: probabilityNarrative(percent, locale),
  };
}

export function buildReminderMessage(templateType, data) {
  const locale = data.locale === 'ko' ? 'ko' : 'en';
  const clientName = data.clientName || (locale === 'ko' ? '고객님' : 'there');
  const projectName = data.projectName || (locale === 'ko' ? '프로젝트' : 'the project');
  const amount = formatCurrencyCompact(data.amount, data.currency || 'USD');
  const expiryDate = data.expiryDate || '';

  const messages = {
    en: {
      gentle: `Hi ${clientName}, just checking in on the ${projectName} proposal (${amount}). Happy to answer any questions or adjust scope if that helps on your side.`,
      firm: `Hi ${clientName}, following up on the ${projectName} proposal (${amount}). I’m holding time for this work this week, so a quick yes / no / needs changes update would help me plan cleanly.`,
      expiry: `Hi ${clientName}, quick note that the ${projectName} proposal (${amount}) is set to expire on ${expiryDate}. If you’d like to keep the current scope and pricing, I can hold it open once I hear back from you.`,
      final: `Hi ${clientName}, this is a final check-in on the ${projectName} proposal (${amount}) before I close the loop on my side. If it is still live, I’m happy to move forward or revise anything you need.`,
    },
    ko: {
      gentle: `${clientName}님, ${projectName} 제안서(${amount}) 관련해서 가볍게 확인드립니다. 필요하신 조정이나 추가 질문이 있으면 편하게 말씀 주세요.`,
      firm: `${clientName}님, ${projectName} 제안서(${amount}) 후속 연락드립니다. 이번 주 일정 정리를 위해 진행 여부나 수정 필요 사항을 간단히 알려주시면 큰 도움이 됩니다.`,
      expiry: `${clientName}님, ${projectName} 제안서(${amount})의 유효기간이 ${expiryDate}까지라 짧게 안내드립니다. 현재 조건으로 유지 원하시면 회신 주시는 대로 이어서 진행하겠습니다.`,
      final: `${clientName}님, ${projectName} 제안서(${amount})에 대해 마지막으로 확인드립니다. 아직 진행 의사가 있으시면 바로 이어가고, 아니면 이번 건은 깔끔하게 마감해두겠습니다.`,
    },
  };

  return messages[locale][templateType] || messages[locale].gentle;
}

export function exportProposalMarkdown(proposal, nextAction, probability) {
  return [
    `# ${proposal.projectName || 'Untitled proposal'}`,
    '',
    `- Client: ${proposal.clientName || ''}`,
    `- Amount: ${formatCurrencyCompact(proposal.amount, proposal.currency || 'USD')}`,
    `- Status: ${proposal.status || ''}`,
    `- Stage: ${proposal.stage || ''}`,
    `- Sent date: ${proposal.sentDate || ''}`,
    `- Expiry date: ${proposal.expiryDate || ''}`,
    `- Close probability: ${probability.percent}% (${probability.label})`,
    '',
    '## Next action',
    nextAction.headline,
    '',
    nextAction.detail,
    '',
    '## Blockers',
    proposal.blockers || 'None',
    '',
    '## Notes',
    proposal.notes || 'None',
    '',
  ].join('\n');
}

export function probabilityLabel(percent) {
  if (percent >= 80) return 'strong';
  if (percent >= 60) return 'warm';
  if (percent >= 45) return 'watchlist';
  return 'cold';
}

export function probabilityNarrative(percent, locale = 'en') {
  if (locale === 'ko') {
    if (percent >= 80) return '흐름이 좋습니다. 마감 조건과 실행 준비를 선명하게 정리하세요.';
    if (percent >= 60) return '관심도는 충분하지만, 다음 스텝을 안정적으로 밀어줄 관리가 필요합니다.';
    if (percent >= 45) return '가능성은 있으나 장애물이나 타이밍 리스크를 먼저 줄여야 합니다.';
    return '확률이 낮습니다. 재자격화하거나 범위를 줄이거나 빠르게 정리하는 편이 좋습니다.';
  }

  if (percent >= 80) return 'Momentum is strong. Focus on clarity and closing details.';
  if (percent >= 60) return 'Healthy interest, but the deal still needs a steady next step.';
  if (percent >= 45) return 'Promising, but blockers or timing risk need attention.';
  return 'Low confidence. Re-qualify, simplify, or move on quickly.';
}

export function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function shiftIsoDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
