'use client';

import { useState, useEffect } from 'react';
import { AppSettings, Board, StatusColumn, EMOJI_OPTIONS, saveSettings } from '@/lib/types';
import { HelpCircle, Plus, X, RefreshCw, CheckCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [newColName, setNewColName] = useState('');
  const [newColEmoji, setNewColEmoji] = useState('✅');
  const [saved, setSaved] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [statusError, setStatusError] = useState('');

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    onChange(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function updateJira(patch: Partial<AppSettings['jira']>) {
    update({ jira: { ...settings.jira, ...patch } });
  }

  function updateSlack(patch: Partial<AppSettings['slack']>) {
    update({ slack: { ...settings.slack, ...patch } });
  }

  async function fetchBoards() {
    const { siteUrl, email, token } = settings.jira;
    if (!siteUrl || !email || !token) {
      setBoardError('Fill in Jira site URL, email and token first.');
      return;
    }
    setLoadingBoards(true);
    setBoardError('');
    try {
      const params = new URLSearchParams({ siteUrl, email, token });
      const res = await fetch(`/api/boards?${params}`);
      const data = await res.json();
      if (!res.ok) { setBoardError(data.error || 'Failed to fetch boards'); return; }
      update({ boards: data.boards });
    } catch (e: any) {
      setBoardError(e.message);
    } finally {
      setLoadingBoards(false);
    }
  }

  function selectBoard(boardId: number) {
    const board = settings.boards.find(b => b.id === boardId);
    update({ selectedBoardId: boardId, selectedProjectKey: board?.projectKey || '' });
  }

  async function fetchStatuses() {
    const { siteUrl, email, token } = settings.jira;
    const projectKey = settings.selectedProjectKey;
    if (!siteUrl || !email || !token || !projectKey) {
      setStatusError('Select a board first.');
      return;
    }
    setLoadingStatuses(true);
    setStatusError('');
    try {
      const params = new URLSearchParams({ siteUrl, email, token, projectKey });
      const res = await fetch(`/api/statuses?${params}`);
      const data = await res.json();
      if (!res.ok) { setStatusError(data.error || 'Failed to fetch statuses'); return; }
      setAvailableStatuses(data.statuses);
    } catch (e: any) {
      setStatusError(e.message);
    } finally {
      setLoadingStatuses(false);
    }
  }

  function toggleStatus(name: string) {
    const existing = settings.statusColumns.find(c => c.name === name.toUpperCase());
    if (existing) {
      update({ statusColumns: settings.statusColumns.filter(c => c.id !== existing.id) });
    } else {
      const col: StatusColumn = { id: Date.now().toString(), name: name.toUpperCase(), emoji: '✅' };
      update({ statusColumns: [...settings.statusColumns, col] });
    }
  }

  function addColumn() {
    if (!newColName.trim()) return;
    const col: StatusColumn = {
      id: Date.now().toString(),
      name: newColName.trim().toUpperCase(),
      emoji: newColEmoji,
    };
    update({ statusColumns: [...settings.statusColumns, col] });
    setNewColName('');
  }

  function removeColumn(id: string) {
    update({ statusColumns: settings.statusColumns.filter(c => c.id !== id) });
  }

  function updateColEmoji(id: string, emoji: string) {
    update({ statusColumns: settings.statusColumns.map(c => c.id === id ? { ...c, emoji } : c) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Jira */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="section-label" style={{ margin: 0 }}>Jira credentials</div>
          <Link href="/guide#jira" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
            <HelpCircle size={13} /> how to get these
          </Link>
        </div>

        <label className="field-label">Site URL</label>
        <input type="text" value={settings.jira.siteUrl}
          onChange={e => updateJira({ siteUrl: e.target.value })}
          placeholder="https://yourcompany.atlassian.net"
          style={{ marginBottom: 10 }} />

        <label className="field-label">Email</label>
        <input type="email" value={settings.jira.email}
          onChange={e => updateJira({ email: e.target.value })}
          placeholder="you@company.com"
          style={{ marginBottom: 10 }} />

        <label className="field-label">
          API Token
          <Link href="/guide#jira-token" target="_blank" style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
            get token ↗
          </Link>
        </label>
        <input type="password" value={settings.jira.token}
          onChange={e => updateJira({ token: e.target.value })}
          placeholder="ATATT3x..."
          style={{ marginBottom: 10 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="field-label">Your display name</label>
            <input type="text" value={settings.jira.displayName}
              onChange={e => updateJira({ displayName: e.target.value })}
              placeholder="Shafin Zaman" />
          </div>
          <div>
            <label className="field-label">Team / project name</label>
            <input type="text" value={settings.teamName}
              onChange={e => update({ teamName: e.target.value })}
              placeholder="Inbox WarmUp" />
          </div>
        </div>
      </div>

      {/* Board selection */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="section-label" style={{ margin: 0 }}>Board</div>
          <button className="btn" onClick={fetchBoards} disabled={loadingBoards}
            style={{ padding: '5px 12px', fontSize: 12 }}>
            <RefreshCw size={12} style={{ animation: loadingBoards ? 'spin 1s linear infinite' : 'none' }} />
            {loadingBoards ? 'loading...' : 'fetch boards'}
          </button>
        </div>

        {boardError && <div className="status-banner status-error" style={{ marginBottom: 10 }}>{boardError}</div>}

        {settings.boards.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
            Enter your Jira credentials above then click "fetch boards"
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {settings.boards.map(b => (
              <div key={b.id}
                onClick={() => selectBoard(b.id)}
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${settings.selectedBoardId === b.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: settings.selectedBoardId === b.id ? 'rgba(124,106,247,0.08)' : 'var(--surface2)',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 13, color: settings.selectedBoardId === b.id ? 'var(--accent)' : 'var(--text)' }}>
                  {b.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
                  {b.projectName} · {b.projectKey}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status columns */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="section-label" style={{ margin: 0 }}>Status columns to track</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn" onClick={fetchStatuses} disabled={loadingStatuses}
              style={{ padding: '5px 12px', fontSize: 12 }}>
              <RefreshCw size={12} style={{ animation: loadingStatuses ? 'spin 1s linear infinite' : 'none' }} />
              {loadingStatuses ? 'loading...' : 'fetch statuses'}
            </button>
            <Link href="/guide#columns" target="_blank" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <HelpCircle size={13} /> help
            </Link>
          </div>
        </div>

        {statusError && <div className="status-banner status-error" style={{ marginBottom: 10 }}>{statusError}</div>}

        {availableStatuses.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 8 }}>
              Click to toggle — selected statuses appear in your summary
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {availableStatuses.map(name => {
                const active = settings.statusColumns.some(c => c.name === name.toUpperCase());
                return (
                  <button key={name} onClick={() => toggleStatus(name)}
                    style={{
                      padding: '5px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'rgba(124,106,247,0.12)' : 'var(--surface2)',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      fontFamily: 'IBM Plex Mono, monospace',
                      transition: 'all 0.15s',
                    }}>
                    {active ? '✓ ' : ''}{name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {settings.statusColumns.map(col => (
            <div key={col.id} className="tag">
              <select
                value={col.emoji}
                onChange={e => updateColEmoji(col.id, e.target.value)}
                style={{ width: 'auto', padding: '0 4px', fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 0 }}>
                {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <span style={{ fontSize: 12 }}>{col.name}</span>
              <button onClick={() => removeColumn(col.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <select value={newColEmoji} onChange={e => setNewColEmoji(e.target.value)}
            style={{ width: 'auto', padding: '8px 10px', marginBottom: 0 }}>
            {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)}
            placeholder="e.g. IN PROGRESS"
            onKeyDown={e => e.key === 'Enter' && addColumn()}
            style={{ flex: 1, marginBottom: 0 }} />
          <button className="btn" onClick={addColumn} style={{ padding: '8px 14px' }}>
            <Plus size={14} /> add
          </button>
        </div>
      </div>

      {/* Slack */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="section-label" style={{ margin: 0 }}>Slack (optional)</div>
          <Link href="/guide#slack" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
            <HelpCircle size={13} /> how to create webhook
          </Link>
        </div>

        <label className="field-label">Webhook URL</label>
        <input type="password" value={settings.slack.webhookUrl}
          onChange={e => updateSlack({ webhookUrl: e.target.value })}
          placeholder="https://hooks.slack.com/services/..."
          style={{ marginBottom: 10 }} />

        <label className="field-label">Channel label (display only)</label>
        <input type="text" value={settings.slack.channelLabel}
          onChange={e => updateSlack({ channelLabel: e.target.value })}
          placeholder="#daily-standup" />
      </div>

      {saved && (
        <div className="status-banner status-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={13} /> Settings saved to browser
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
