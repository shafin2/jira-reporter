import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jira Daily Reporter",
  description: "Auto-generate and send your daily Jira summary to Slack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
