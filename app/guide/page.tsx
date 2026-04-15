import Link from 'next/link';

export default function Guide() {
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', fontFamily: 'IBM Plex Mono, monospace' }}>← back to app</Link>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginTop: 12, letterSpacing: '-0.02em' }}>Setup Guide</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Everything you need to get Jira Daily Reporter running in under 5 minutes.</p>
      </div>

      <Section id="jira" title="Step 1 — Jira credentials">
        <p>You need 3 things from Jira: your <b>site URL</b>, your <b>email</b>, and an <b>API token</b>.</p>
        <StepList steps={[
          'Your site URL is the domain you use to access Jira, e.g. https://yourcompany.atlassian.net',
          'Your email is the one you log into Jira with.',
        ]} />
      </Section>

      <Section id="jira-token" title="Step 2 — Get your Jira API token">
        <StepList steps={[
          'Go to https://id.atlassian.net/manage-profile/security/api-tokens',
          'Click "Create API token"',
          'Give it a label like "Daily Reporter"',
          'Copy the token and paste it in the app (it only shows once)',
          '⚠ Never share this token — it gives full access to your Jira account',
        ]} />
        <LinkButton href="https://id.atlassian.net/manage-profile/security/api-tokens">Open API tokens page ↗</LinkButton>
      </Section>

      <Section id="boards" title="Step 3 — Select your board">
        <p>After saving your Jira credentials, click <b>"fetch boards"</b> in the Board section. It will list all boards you have access to. Click the one you want to report on.</p>
        <p style={{ marginTop: 10 }}>If you have multiple projects or boards, just pick the one that matches your daily work. You can change it anytime.</p>
      </Section>

      <Section id="columns" title="Step 4 — Add status columns">
        <p>These are the <b>exact names</b> of the columns on your Jira board that you want to include in your daily summary.</p>
        <StepList steps={[
          'Go to your Jira board',
          'Look at the column headers (e.g. "In Progress", "Ready to Test", "Done")',
          'Type the exact name (case-insensitive) in the field and click Add',
          'Pick an emoji to make the Slack message more readable',
          'Add as many as you want — each becomes a section in the summary',
        ]} />
        <Tip>You only see tickets that were moved to these statuses within your selected timeline and are assigned to you.</Tip>
      </Section>

      <Section id="slack" title="Step 5 — Slack webhook (optional)">
        <p>If you want to send the summary directly to a Slack channel, you need a webhook URL. This is only needed if your Slack workspace has app slots available.</p>
        <StepList steps={[
          'Go to https://api.slack.com/apps and click "Create New App"',
          'Choose "From scratch", give it a name like "Daily Reporter", select your workspace',
          'In the left sidebar, go to "Incoming Webhooks"',
          'Toggle "Activate Incoming Webhooks" to ON',
          'Click "Add New Webhook to Workspace"',
          'Select the channel you want to post to',
          'Copy the Webhook URL and paste it in the app',
        ]} />
        <LinkButton href="https://api.slack.com/apps">Open Slack Apps ↗</LinkButton>
        <Tip>No Slack? No problem. Use "Generate" to create the summary, then copy-paste it yourself.</Tip>
      </Section>

      <Section id="usage" title="Using the app">
        <StepList steps={[
          'Go to the Summary tab',
          'Pick a timeline: Today, Last 2 days, Last 3 days, or This week',
          'Click "generate" to fetch and preview the summary',
          'Click "generate + send" to fetch AND automatically post to Slack in one click',
          'Or use "copy" on the preview to paste it manually anywhere',
        ]} />
        <Tip>All your settings are saved automatically in your browser. No account needed, no data leaves your machine except the API calls to Jira and Slack.</Tip>
      </Section>

      <Section id="privacy" title="Privacy & security">
        <p>This app runs entirely in your browser + a local server. Your Jira token and Slack webhook are:</p>
        <StepList steps={[
          'Stored only in your browser localStorage — never sent to any third party',
          'Used only to make API calls directly to Jira and Slack',
          'Never logged or stored on any server',
        ]} />
        <Tip>Rotate your Jira API token periodically at the Atlassian security page for best practice.</Tip>
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: 'var(--accent)' }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((s, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{s}</li>)}
    </ol>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
      💡 {children}
    </div>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)', textDecoration: 'none', fontFamily: 'IBM Plex Mono, monospace' }}>
      {children}
    </a>
  );
}
