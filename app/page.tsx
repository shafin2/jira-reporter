'use client';

import { useState, useEffect } from 'react';
import { AppSettings, loadSettings } from '@/lib/types';
import SettingsPanel from '@/components/SettingsPanel';
import SummaryPanel from '@/components/SummaryPanel';
import Link from 'next/link';

export default function Home() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [tab, setTab] = useState<'summary' | 'settings'>('summary');

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    if (!s.jira.token) setTab('settings');
  }, []);

  if (!settings) return null;

  const isConfigured = !!settings.jira.token && !!settings.selectedProjectKey && settings.statusColumns.length > 0;

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, background: isConfigured ? '#4ade80' : 'var(--accent)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <h1 style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>Jira Daily Reporter</h1>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {isConfigured ? `// ${settings.jira.displayName || 'dev'} · ${settings.selectedProjectKey} · ${settings.statusColumns.length} columns` : '// configure your settings to get started'}
            </div>
          </div>
          <Link href="/guide" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', textDecoration: 'none', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
            📖 guide
          </Link>
        </div>
      </header>

      {!isConfigured && (
        <div className="status-banner status-info" style={{ marginBottom: '1.25rem' }}>
          👋 First time? Go to <strong>Settings</strong> below → add Jira credentials → fetch boards → add status columns.{' '}
          <Link href="/guide" target="_blank" style={{ color: 'var(--accent)' }}>Read the guide</Link> for step-by-step help.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
        {(['summary', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, background: tab === t ? 'var(--accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}>
            {t === 'summary' ? '⚡ Summary' : '⚙ Settings'}
          </button>
        ))}
      </div>

      {tab === 'summary' && <SummaryPanel settings={settings} />}
      {tab === 'settings' && <SettingsPanel settings={settings} onChange={setSettings} />}

      <style>{`@keyframes pulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.4); } }`}</style>
    </div>
  );
}
