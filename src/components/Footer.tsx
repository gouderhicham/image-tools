import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>Image Crop</strong>
          <span>•</span>
          <span>Precision Image Editor</span>
        </div>

        <div className="footer-links">
          <span className="footer-privacy-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            100% Private Client-Side Processing
          </span>

          <span>•</span>

          <a
            href="https://www.linkedin.com/in/gouder-hicham619/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-author-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.65 1.65 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66Z" />
            </svg>
            <span>Gouder Hicham</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
