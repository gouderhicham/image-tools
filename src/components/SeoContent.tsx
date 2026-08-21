import React, { useState } from 'react';
import type { AppTab } from '../utils/seo';

interface SeoContentProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const SeoContent: React.FC<SeoContentProps> = ({ activeTab, onSelectTab }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Is Image Crop Studio completely free to use?',
      a: 'Yes, Image Crop Studio is 100% free with unlimited image conversions, compressions, crops, and background removals. There are no daily limits, paywalls, or watermarks.',
    },
    {
      q: 'Are my images uploaded to any cloud server?',
      a: 'No. All processing runs 100% locally in your web browser using HTML5 Canvas, Web Workers, and WebAssembly. Your photos never leave your device, ensuring total privacy and GDPR compliance by design.',
    },
    {
      q: 'What image formats are supported for conversion and editing?',
      a: 'We support Apple HEIC/HEIF, AVIF, WebP, PNG, JPEG/JPG, JFIF, SVG, Windows ICO (Favicon), BMP, TIFF, GIF, and PDF document exports.',
    },
    {
      q: 'How do I compress an image to an exact target size in KB?',
      a: 'Select the Compress tool, enter your desired target file size (e.g. 100 KB or 50 KB), choose your preferred format (WebP or JPEG), and click Compress. The engine automatically optimizes quality to match your target file weight.',
    },
    {
      q: 'Can I convert iPhone HEIC photos directly on mobile?',
      a: 'Yes. When you upload or paste an Apple .heic or .heif photo from an iPhone or iPad, our browser worker automatically decodes it instantly, allowing you to convert it to PNG, JPG, WebP, AVIF, or PDF.',
    },
    {
      q: 'How does the rounded corner border radius cropper work?',
      a: 'In the Crop tool, you can adjust the corner radius slider in pixels or percentages. You can round all corners uniformly or customize individual top-left, top-right, bottom-right, and bottom-left radii independently with transparent alpha matte export.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section className="seo-content-section" aria-labelledby="seo-main-heading">
      {/* Main SEO Header */}
      <div className="seo-header">
        <span className="seo-pill-tag">Free Online Image Toolkit</span>
        <h2 id="seo-main-heading" className="seo-title">
          Professional Image Conversion, Compression &amp; Editing Suite
        </h2>
        <p className="seo-subtitle">
          Everything you need to optimize, convert, frame, and segment your images in seconds —
          fast, high-fidelity, and 100% private in your browser.
        </p>
      </div>

      {/* 4 Core Features Grid */}
      <div className="seo-features-grid">
        {/* Tool 1: Compressor */}
        <article
          className={`seo-feature-card ${activeTab === 'compress' ? 'highlighted' : ''}`}
          onClick={() => onSelectTab('compress')}
        >
          <div className="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
          <h3>Free Image Compressor</h3>
          <p>
            Reduce image file size to your exact target KB or MB with multi-iteration quality balancing.
            Shrink photos for websites, emails, and forms without visible artifacts.
          </p>
          <span className="feature-link">Open Compressor →</span>
        </article>

        {/* Tool 2: Converter */}
        <article
          className={`seo-feature-card ${activeTab === 'convert' ? 'highlighted' : ''}`}
          onClick={() => onSelectTab('convert')}
        >
          <div className="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>
          <h3>Universal Image Converter</h3>
          <p>
            Convert between 11+ formats: AVIF, WebP, PNG, JPG, JFIF, Apple HEIC, SVG, Favicon ICO,
            BMP, TIFF, and PDF document export at 100% maximum fidelity.
          </p>
          <span className="feature-link">Open Converter →</span>
        </article>

        {/* Tool 3: Cropper */}
        <article
          className={`seo-feature-card ${activeTab === 'crop' ? 'highlighted' : ''}`}
          onClick={() => onSelectTab('crop')}
        >
          <div className="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </div>
          <h3>Image Cropper &amp; Framing</h3>
          <p>
            Aspect ratio cropping (1:1, 4:3, 16:9, Freeform) with independent corner border radius
            curvature control and transparent alpha cutout export.
          </p>
          <span className="feature-link">Open Cropper →</span>
        </article>

        {/* Tool 4: Background Remover */}
        <article
          className={`seo-feature-card ${activeTab === 'remove-bg' ? 'highlighted' : ''}`}
          onClick={() => onSelectTab('remove-bg')}
        >
          <div className="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h3>AI Background Remover</h3>
          <p>
            Automatic salient object segmentation with surgical alpha matte refinement. Create transparent
            product photos and profile cutouts with zero server uploads.
          </p>
          <span className="feature-link">Open Background Remover →</span>
        </article>
      </div>

      {/* Supported Formats Matrix */}
      <div className="seo-formats-section">
        <h3>Supported Image Formats &amp; Standards</h3>
        <div className="seo-formats-chips">
          <span className="format-chip"><strong>AVIF</strong> — Next-Gen AV1 Web</span>
          <span className="format-chip"><strong>WebP</strong> — Modern High Efficiency</span>
          <span className="format-chip"><strong>PNG</strong> — 32-bit Lossless Alpha</span>
          <span className="format-chip"><strong>JPEG / JPG</strong> — Universal Standard</span>
          <span className="format-chip"><strong>HEIC / HEIF</strong> — Apple iPhone Camera</span>
          <span className="format-chip"><strong>SVG</strong> — Scalable Vector Container</span>
          <span className="format-chip"><strong>ICO</strong> — Windows &amp; Web Favicon</span>
          <span className="format-chip"><strong>PDF</strong> — High-Res Document Sheet</span>
          <span className="format-chip"><strong>BMP</strong> — 24/32-bit Raw Bitmap</span>
          <span className="format-chip"><strong>TIFF</strong> — Archival Print Baseline</span>
          <span className="format-chip"><strong>GIF</strong> — 8-bit Palette</span>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="seo-privacy-banner">
        <div className="privacy-icon-col">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="privacy-text-col">
          <h4>100% Client-Side Privacy &amp; Data Security</h4>
          <p>
            Your images and photos are never uploaded to any remote server or cloud infrastructure. All image
            compression, format encoding, cropping, and background segmentation are processed locally inside your
            browser using Web Workers and HTML5 Canvas.
          </p>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="seo-faq-section">
        <div className="faq-header">
          <span className="seo-pill-tag">Frequently Asked Questions</span>
          <h3>Common Questions About Image Crop Studio</h3>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
