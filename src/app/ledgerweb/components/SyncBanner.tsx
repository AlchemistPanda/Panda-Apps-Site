import React from 'react';

export type SyncStatus = 'synced' | 'saving' | 'error' | 'unconfigured';

interface SyncBannerProps {
  status: SyncStatus;
  onRetry?: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ status, onRetry }) => {
  if (status === 'synced') return null;

  return (
    <div className={`sync-banner-container ${status}`}>
      <style>{`
        .sync-banner-container {
          width: 100%;
          padding: 12px 24px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border: 1px solid transparent;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Saving State */
        .sync-banner-container.saving {
          background-color: rgba(255, 159, 10, 0.08);
          border-color: rgba(255, 159, 10, 0.2);
          color: var(--color-warning);
          box-shadow: 0 4px 12px rgba(255, 159, 10, 0.05);
        }

        .sync-indicator-pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-warning);
          animation: pulse 1.5s infinite ease-in-out;
          margin-right: 8px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px var(--color-warning); }
        }

        /* Error State */
        .sync-banner-container.error {
          background-color: rgba(255, 59, 48, 0.08);
          border-color: rgba(255, 59, 48, 0.3);
          color: #ff453a;
          box-shadow: 0 4px 16px rgba(255, 59, 48, 0.1);
        }

        .sync-banner-container.error button {
          background: rgba(255, 59, 48, 0.15);
          border: 1px solid rgba(255, 59, 48, 0.3);
          color: #ff453a;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sync-banner-container.error button:hover {
          background: rgba(255, 59, 48, 0.25);
          border-color: rgba(255, 59, 48, 0.5);
        }

        /* Unconfigured State */
        .sync-banner-container.unconfigured {
          background-color: rgba(100, 116, 139, 0.08);
          border-color: rgba(100, 116, 139, 0.2);
          color: var(--text-secondary);
          flex-direction: column;
          align-items: flex-start;
          padding: 16px 24px;
        }

        .unconfigured-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .unconfigured-details {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 8px;
          line-height: 1.4;
        }
      `}</style>

      {status === 'saving' && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="sync-indicator-pulse" />
          <span>Syncing changes to Upstash Redis cloud database...</span>
        </div>
      )}

      {status === 'error' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span><strong>Sync Failure:</strong> Unable to save your changes to the internet database. Please check your connection.</span>
          </div>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Retry Sync
            </button>
          )}
        </>
      )}

      {status === 'unconfigured' && (
        <>
          <div className="unconfigured-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span>
              <span><strong>Demo Mode:</strong> No live internet database is configured. Data is saved in your browser locally.</span>
            </div>
          </div>
          <div className="unconfigured-details">
            To connect your permanent database for safety, configure <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> env variables in Vercel or locally in a <code>.env.local</code> file.
          </div>
        </>
      )}
    </div>
  );
};
