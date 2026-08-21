import React from 'react';

interface NavbarProps {
  activeTab: 'compress' | 'crop' | 'convert' | 'remove-bg';
  setActiveTab: (tab: 'compress' | 'crop' | 'convert' | 'remove-bg') => void;
  hasFile: boolean;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasFile,
  onReset,
}) => {
  return (
    <>
      {/* Top Main Navbar */}
      <header className="navbar" aria-label="Main Navigation">
        <div className="navbar-inner">
          {/* Brand Logo & Title */}
          <div className="nav-brand">
            <div className="brand-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M18 22V8a2 2 0 0 0-2-2H2" />
              </svg>
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Image Crop</span>
              <span className="brand-tag">Studio</span>
            </div>
          </div>

          {/* Desktop-Only Center Tool Switcher (Hidden on Mobile) */}
          <div className="nav-tools-wrapper desktop-only-tools">
            <div className="nav-tools" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'compress'}
                className={`nav-tool-btn ${activeTab === 'compress' ? 'active' : ''}`}
                onClick={() => setActiveTab('compress')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Compress</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'crop'}
                className={`nav-tool-btn ${activeTab === 'crop' ? 'active' : ''}`}
                onClick={() => setActiveTab('crop')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                  <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                </svg>
                <span>Crop</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'convert'}
                className={`nav-tool-btn ${activeTab === 'convert' ? 'active' : ''}`}
                onClick={() => setActiveTab('convert')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Convert</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'remove-bg'}
                className={`nav-tool-btn ${activeTab === 'remove-bg' ? 'active' : ''}`}
                onClick={() => setActiveTab('remove-bg')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>Remove BG</span>
              </button>
            </div>
          </div>

          {/* Right Actions: Author & Reset */}
          <div className="nav-actions">
            {hasFile && (
              <button
                type="button"
                className="btn-secondary nav-reset-btn"
                onClick={onReset}
                title="Open a different image"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="action-text">New Image</span>
              </button>
            )}

            <a
              href="https://www.linkedin.com/in/gouder-hicham619/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-author-link"
              title="Author: Gouder Hicham on LinkedIn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.65 1.65 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66Z" />
              </svg>
              <span className="author-name">Gouder Hicham</span>
            </a>
          </div>
        </div>
      </header>

      {/* Mobile-Only Bottom Navigation Dock (Thumb-Friendly, Fixed Bottom) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Tool Navigation">
        <button
          type="button"
          aria-selected={activeTab === 'compress'}
          className={`mobile-nav-item ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          <div className="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
          <span className="mobile-nav-label">Compress</span>
        </button>

        <button
          type="button"
          aria-selected={activeTab === 'crop'}
          className={`mobile-nav-item ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          <div className="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </div>
          <span className="mobile-nav-label">Crop</span>
        </button>

        <button
          type="button"
          aria-selected={activeTab === 'convert'}
          className={`mobile-nav-item ${activeTab === 'convert' ? 'active' : ''}`}
          onClick={() => setActiveTab('convert')}
        >
          <div className="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>
          <span className="mobile-nav-label">Convert</span>
        </button>

        <button
          type="button"
          aria-selected={activeTab === 'remove-bg'}
          className={`mobile-nav-item ${activeTab === 'remove-bg' ? 'active' : ''}`}
          onClick={() => setActiveTab('remove-bg')}
        >
          <div className="mobile-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <span className="mobile-nav-label">Remove BG</span>
        </button>
      </nav>
    </>
  );
};
