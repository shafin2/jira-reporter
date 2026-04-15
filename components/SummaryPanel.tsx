'use client';

import { useState } from 'react';
import { AppSettings, JiraTicket, SummaryGroup, buildSlackMessage, formatTime } from '@/lib/types';
import { Play, Send, Copy, Check, Clock, Hash, Layers } from 'lucide-react';

interface Props {
  settings: AppSettings;
}

const TIMELINE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '2days', label: 'Last 2 days' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week', label: 'This week' },
  { value: 'custom', label: 'Custom' },
];

export default function SummaryPanel({ settings }: Props) {
  const [timeline, setTimeline] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<SummaryGroup[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [timelineLabel, setTimelineLabel] = useState('');
  const [slackMsg, setSlackMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [slackSent, setSlackSent] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  function validate() {
    const { siteUrl, email, token } = settings.jira;
    if (!siteUrl || !email || !token) return 'Fill in your Jira credentials in Settings first.';
    if (!settings.selectedProjectKey) return 'Select a board in Settings first.';
    if (!settings.statusColumns.length) return 'Add at least one status column in Settings.';
    return null;
  }

  async function generate(andSend = false) {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setSlackSent(false);

    try {
      if (timeline === 'custom' && (!customFrom || !customTo)) {
        setError('Select both a start and end date for custom range.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: settings.jira.siteUrl,
          email: settings.jira.email,
          token: settings.jira.token,
          projectKey: settings.selectedProjectKey,
          statusColumns: settings.statusColumns.map(c => c.name),
          timeline,
          customFrom,
          customTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to fetch'); setLoading(false); return; }

      const tickets: JiraTicket[] = data.tickets;
      setTimelineLabel(data.timelineLabel);

      // Group tickets by their current status.
      // Tickets are history-based so they may now be in any status — group by current status,
      // using configured columns first, then any remaining tickets under their actual status.
      const configuredNames = settings.statusColumns.map(c => c.name.toUpperCase());
      const grouped: SummaryGroup[] = settings.statusColumns.map(col => ({
        status: col.name,
        emoji: col.emoji,
        tickets: tickets.filter(t => t.status.toUpperCase() === col.name.toUpperCase()),
      }));
      // Add an "Other" group for tickets that have moved beyond the tracked columns
      const accounted = new Set(grouped.flatMap(g => g.tickets.map(t => t.key)));
      const others = tickets.filter(t => !accounted.has(t.key));
      if (others.length > 0) {
        grouped.push({ status: 'Moved forward', emoji: '➡️', tickets: others });
      }

      const total = tickets.reduce((a, t) => a + (t.timespent || 0), 0);
      setGroups(grouped);
      setTotalSeconds(total);
      setHasFetched(true);

      const msg = buildSlackMessage(grouped, total, settings.jira.displayName, settings.teamName, data.timelineLabel);
      setSlackMsg(msg);

      if (andSend) {
        await sendToSlack(msg);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendToSlack(msg?: string) {
    const message = msg || slackMsg;
    if (!settings.slack.webhookUrl) { setError('Add your Slack webhook URL in Settings first.'); return; }
    if (!message) { setError('Generate a summary first.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: settings.slack.webhookUrl, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Slack send failed'); return; }
      setSlackSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  function copyMessage() {
    navigator.clipboard.writeText(slackMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalTickets = groups.reduce((a, g) => a + g.tickets.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Timeline + Actions */}
      <div className="card">
        <div className="section-label">Generate summary</div>

        <label className="field-label">Timeline</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: timeline === 'custom' ? 10 : 16, flexWrap: 'wrap' }}>
          {TIMELINE_OPTIONS.map(opt => (
            <button key={opt.value}
              onClick={() => setTimeline(opt.value)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                borderColor: timeline === opt.value ? 'var(--accent)' : 'var(--border)',
                color: timeline === opt.value ? 'var(--accent)' : 'var(--text)',
                background: timeline === opt.value ? 'rgba(124,106,247,0.1)' : 'var(--surface2)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {timeline === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label className="field-label">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="field-label">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ marginBottom: 0 }} />
            </div>
          </div>
        )}

        {settings.selectedProjectKey && (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 14 }}>
            Board: <span style={{ color: 'var(--accent)' }}>{settings.selectedProjectKey}</span>
            {' '}· Columns: <span style={{ color: 'var(--accent)' }}>{settings.statusColumns.map(c => c.name).join(', ')}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn" onClick={() => generate(false)} disabled={loading || sending}
            style={{ padding: '10px' }}>
            <Play size={14} />
            {loading ? 'fetching...' : 'generate'}
          </button>
          <button className="btn btn-primary" onClick={() => generate(true)} disabled={loading || sending}
            style={{ padding: '10px' }}>
            <Send size={14} />
            {sending ? 'sending...' : 'generate + send'}
          </button>
        </div>
      </div>

      {error && (
        <div className="status-banner status-error">{error}</div>
      )}

      {slackSent && (
        <div className="status-banner status-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={13} /> Sent to Slack {settings.slack.channelLabel && `→ ${settings.slack.channelLabel}`}
        </div>
      )}

      {/* Stats */}
      {hasFetched && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: <Hash size={14} />, val: totalTickets, label: 'tickets' },
            { icon: <Clock size={14} />, val: formatTime(totalSeconds) || '—', label: 'logged' },
            { icon: <Layers size={14} />, val: settings.statusColumns.filter(c => groups.find(g => g.status === c.name && g.tickets.length > 0)).length, label: 'statuses' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent)', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--accent)' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket groups */}
      {hasFetched && groups.map(group => group.tickets.length > 0 && (
        <div key={group.status} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>{group.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{group.status}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {group.tickets.length} ticket{group.tickets.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.tickets.map(t => (
              <div key={t.key} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <a href={`${settings.jira.siteUrl}/browse/${t.key}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                    {t.key}
                  </a>
                  {t.timespent && (
                    <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: '#4ade80' }}>
                      {formatTime(t.timespent)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{t.summary}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 3 }}>
                  {t.projectName} · {t.issueType}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {hasFetched && totalTickets === 0 && (
        <div className="status-banner status-warn">
          No tickets found for the selected statuses in {timelineLabel.toLowerCase()}. Try a wider timeline or check your column names match exactly.
        </div>
      )}

      {/* Slack preview */}
      {slackMsg && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="section-label" style={{ margin: 0 }}>Slack message preview</div>
            <button className="btn" onClick={copyMessage} style={{ padding: '5px 12px', fontSize: 12, gap: 5 }}>
              {copied ? <><Check size={12} /> copied</> : <><Copy size={12} /> copy</>}
            </button>
          </div>
          <pre style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
            color: 'var(--muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7,
          }}>
            {slackMsg}
          </pre>
          {!slackSent && settings.slack.webhookUrl && (
            <button className="btn btn-primary" onClick={() => sendToSlack()} disabled={sending}
              style={{ width: '100%', marginTop: 10 }}>
              <Send size={14} />
              {sending ? 'sending...' : `send to slack${settings.slack.channelLabel ? ' → ' + settings.slack.channelLabel : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
