'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PandaLogo } from './components/PandaLogo';
import { db } from './services/db';

export default function Dashboard() {
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    setDbConnected(db.isConfigured());
  }, []);

  const handleClearSession = () => {
    localStorage.removeItem('pandathings_unlocked');
    sessionStorage.removeItem('pandathings_unlocked');
    window.location.reload();
  };

  return (
    <main className="app-container animate-fade-in">
      <style>{`
        .dashboard-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 40px;
          margin-bottom: 48px;
        }

        .dashboard-title {
          font-size: 2.75rem;
          margin-top: 16px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 30%, #a180ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dashboard-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .db-status-badge {
          margin-top: 16px;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: var(--font-display);
        }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          width: 100%;
          margin-bottom: 48px;
        }

        .app-card {
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-decoration: none;
          color: inherit;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .app-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 100% 100%, var(--accent-purple-glow) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .app-card:hover {
          transform: translateY(-4px);
          border-color: rgba(142, 84, 255, 0.3);
        }

        .app-card:hover::before {
          opacity: 1;
        }

        .app-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: rgba(142, 84, 255, 0.1);
          border: 1px solid rgba(142, 84, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 1.5rem;
          transition: all 0.3s ease;
        }

        .app-card:hover .app-icon-wrapper {
          background: var(--accent-purple);
          border-color: var(--accent-purple);
          transform: scale(1.05);
          box-shadow: 0 0 16px var(--accent-purple-glow);
        }

        .app-card-title {
          font-size: 1.35rem;
          margin-bottom: 12px;
          font-family: var(--font-display);
        }

        .app-card-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .app-card-link {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--accent-purple);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: auto;
        }

        .app-card-link svg {
          transition: transform 0.2s ease;
        }

        .app-card:hover .app-card-link svg {
          transform: translateX(4px);
        }

        .app-card.disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .app-card.disabled:hover {
          transform: none;
          border-color: var(--border-color);
        }

        .app-card.disabled .app-icon-wrapper {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--border-color);
        }

        .dashboard-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: auto;
          padding: 24px 0;
          border-top: 1px solid var(--border-color);
        }
      `}</style>

      <header className="dashboard-header">
        <PandaLogo width={120} height={120} />
        <h1 className="dashboard-title">PandaThings</h1>
        <p className="dashboard-subtitle">
          Your personal suite of handcrafted, premium hobby applications.
        </p>
        <div className="db-status-badge">
          {dbConnected ? (
            <span className="badge badge-credited">☁️ Cloud Database Connected</span>
          ) : (
            <span className="badge badge-pending">⚠️ Demo Mode: Local Storage</span>
          )}
        </div>
      </header>

      <section className="apps-grid">
        {/* Profit Analyzer App */}
        <Link href="/ledgerweb/profit-analyzer" className="app-card glass-panel">
          <div className="app-icon-wrapper">📈</div>
          <h3 className="app-card-title">Profit Analyzer</h3>
          <p className="app-card-desc">
            Track and visualize your investment returns. Features daily/weekly/monthly payouts, holiday adjustments, statements, and quick sharing.
          </p>
          <div className="app-card-link">
            Open Analyzer
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </Link>

        {/* Coming Soon: Placeholders */}
        <div className="app-card glass-panel disabled">
          <span className="badge badge-holiday" style={{ position: 'absolute', top: '16px', right: '16px' }}>Coming Soon</span>
          <div className="app-icon-wrapper">📔</div>
          <h3 className="app-card-title">Panda Journal</h3>
          <p className="app-card-desc">
            A minimalist workspace for markdown-based tracking, bullet points, and clean visual notes.
          </p>
          <div className="app-card-link" style={{ color: 'var(--text-muted)' }}>Locked</div>
        </div>

        <div className="app-card glass-panel disabled">
          <span className="badge badge-holiday" style={{ position: 'absolute', top: '16px', right: '16px' }}>Coming Soon</span>
          <div className="app-icon-wrapper">⏱️</div>
          <h3 className="app-card-title">Panda Focus</h3>
          <p className="app-card-desc">
            An elegant pomodoro timer integrated with micro-soundscapes and progress insights.
          </p>
          <div className="app-card-link" style={{ color: 'var(--text-muted)' }}>Locked</div>
        </div>
      </section>

      <footer className="dashboard-actions">
        <button
          type="button"
          className="glass-button danger"
          onClick={handleClearSession}
        >
          🔒 Lock Session
        </button>
      </footer>
    </main>
  );
}
