export interface JiraConfig {
  siteUrl: string;
  email: string;
  token: string;
  displayName: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channelLabel: string;
}

export interface Board {
  id: number;
  name: string;
  projectKey: string;
  projectName: string;
}

export interface StatusColumn {
  id: string;
  name: string;
  emoji: string;
}

export interface AppSettings {
  jira: JiraConfig;
  slack: SlackConfig;
  boards: Board[];
  selectedBoardId: number | null;
  selectedProjectKey: string;
  statusColumns: StatusColumn[];
  teamName: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  timespent: number | null;
  projectKey: string;
  projectName: string;
  issueType: string;
  assignee: string;
  updated: string;
}

export interface SummaryGroup {
  status: string;
  emoji: string;
  tickets: JiraTicket[];
}

const STORAGE_KEY = 'jira_reporter_settings';

export const DEFAULT_COLUMNS: StatusColumn[] = [
  { id: '1', name: 'READY TO TEST', emoji: '✅' },
  { id: '2', name: 'IN PROGRESS', emoji: '🔄' },
];

export const EMOJI_OPTIONS = ['✅','🔄','🧪','🐛','🚀','⏳','🎯','💡','🔥','📋'];

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function defaultSettings(): AppSettings {
  return {
    jira: { siteUrl: '', email: '', token: '', displayName: '' },
    slack: { webhookUrl: '', channelLabel: '' },
    boards: [],
    selectedBoardId: null,
    selectedProjectKey: '',
    statusColumns: DEFAULT_COLUMNS,
    teamName: '',
  };
}

export function formatTime(seconds: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export function buildSlackMessage(
  groups: SummaryGroup[],
  totalSeconds: number,
  displayName: string,
  teamName: string,
  timeline: string
): string {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const totalTickets = groups.reduce((a, g) => a + g.tickets.length, 0);

  let msg = `*Daily Summary — ${dateStr}*\n`;
  msg += `_${displayName}${teamName ? ' | ' + teamName : ''}_\n`;
  msg += `_Timeline: ${timeline}_\n\n`;

  if (totalTickets === 0) {
    msg += `_No tickets found for the selected statuses._`;
    return msg;
  }

  groups.forEach(group => {
    if (group.tickets.length === 0) return;
    msg += `${group.emoji} *${group.status}* (${group.tickets.length} ticket${group.tickets.length !== 1 ? 's' : ''})\n`;
    group.tickets.forEach(t => {
      const time = formatTime(t.timespent);
      msg += `• *${t.key}* — ${t.summary}${time ? ` _(${time})_` : ''}\n`;
    });
    msg += '\n';
  });

  // if (totalSeconds > 0) {
  //   msg += `⏱ *Total logged: ${formatTime(totalSeconds)}*`;
  // }

  return msg.trim();
}
