'use client';

import React, { useState, useEffect } from 'react';
import { PandaLogo } from './PandaLogo';

interface SecurityLockProps {
  children: React.ReactNode;
}

export const SecurityLock: React.FC<SecurityLockProps> = ({ children }) => {
  const [pin, setPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    // Check persistent storage on mount (browser only)
    if (typeof window !== 'undefined') {
      const isUnlockedLocal = localStorage.getItem('pandathings_unlocked') === 'true';
      if (isUnlockedLocal) {
        setIsUnlocked(true);
      }
      setIsLoading(false);
    }
  }, []);

  const handleKeyPress = (num: string) => {
    if (hasError) setHasError(false);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate if 4 digits entered
      if (nextPin === '9090') {
        triggerSuccess();
      } else if (nextPin.length === 4) {
        // Wrong PIN
        setTimeout(() => {
          setHasError(true);
          setPin('');
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    if (hasError) setHasError(false);
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (hasError) setHasError(false);
    setPin('');
  };

  const triggerSuccess = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem('pandathings_unlocked', 'true');
      setIsUnlocked(true);
    }, 400); // matches CSS exit animation duration
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnlocked) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isUnlocked, hasError]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#080a0f',
        color: '#ffffff'
      }}>
        <div className="loader-placeholder">Preparing PandaThings...</div>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className={`lock-screen-wrapper ${isExiting ? 'exit-animation' : ''}`}>
      <style>{`
        .lock-screen-wrapper {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #161b26 0%, #080a0f 100%);
          padding: 24px;
        }

        .exit-animation {
          animation: fadeOutZoom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeOutZoom {
          from { opacity: 1; transform: scale(1); filter: blur(0); }
          to { opacity: 0; transform: scale(1.05); filter: blur(8px); pointer-events: none; }
        }

        .lock-card {
          width: 100%;
          max-width: 380px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .lock-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          margin-top: 16px;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .lock-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .dots-container {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pin-dot.filled {
          background-color: var(--accent-purple);
          border-color: var(--accent-purple);
          box-shadow: 0 0 12px var(--accent-purple-glow);
          transform: scale(1.15);
        }

        .pin-dot.error {
          background-color: var(--color-error);
          border-color: var(--color-error);
          box-shadow: 0 0 12px rgba(255, 59, 48, 0.4);
        }

        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 280px;
        }

        .keypad-button {
          height: 64px;
          width: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          transition: all 0.15s ease;
          user-select: none;
        }

        .keypad-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .keypad-button:active {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(0.95);
        }

        .keypad-button.action {
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .error-message {
          color: var(--color-error);
          font-size: 0.85rem;
          margin-top: 16px;
          height: 20px;
          font-weight: 500;
        }
      `}</style>

      <div className={`lock-card glass-panel ${hasError ? 'animate-shake' : ''}`}>
        <PandaLogo width={96} height={96} isHappy={!hasError} />
        
        <h2 className="lock-title">PandaThings</h2>
        <p className="lock-subtitle">Enter passcode to open your workspace</p>
        
        <div className="dots-container">
          {[0, 1, 2, 3].map((index) => {
            let dotClass = '';
            if (hasError) {
              dotClass = 'error';
            } else if (index < pin.length) {
              dotClass = 'filled';
            }
            return <div key={index} className={`pin-dot ${dotClass}`} />;
          })}
        </div>
        
        <div className="keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              className="keypad-button"
              onClick={() => handleKeyPress(num)}
            >
              {num}
            </button>
          ))}
          
          <button
            type="button"
            className="keypad-button action"
            onClick={handleClear}
            aria-label="Clear PIN"
          >
            Clear
          </button>
          
          <button
            type="button"
            className="keypad-button"
            onClick={() => handleKeyPress('0')}
          >
            0
          </button>
          
          <button
            type="button"
            className="keypad-button action"
            onClick={handleBackspace}
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>

        <div className="error-message">
          {hasError && 'Access Denied. Please try again.'}
        </div>
      </div>
    </div>
  );
};
