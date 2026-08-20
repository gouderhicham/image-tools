import React from 'react';

interface HeaderProps {
  activeTab: 'compress' | 'crop' | 'convert' | 'remove-bg';
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getInfo = () => {
    switch (activeTab) {
      case 'compress':
        return {
          title: 'Image Compressor',
          description: 'Reduce file weight to your exact target size without visible degradation.',
        };
      case 'crop':
        return {
          title: 'Image Cropper & Framing',
          description: 'Aspect ratio cropping with real-time corner border radius and curvature control.',
        };
      case 'convert':
        return {
          title: 'Universal Image Converter',
          description: 'Zero-server browser format conversion supporting AVIF, WebP, PNG, JPG, JFIF, SVG, ICO, BMP, TIFF, and PDF.',
        };
      case 'remove-bg':
        return {
          title: 'Background Segmentation',
          description: 'Automatic salient object extraction with surgical alpha matte refinement.',
        };
    }
  };

  const { title, description } = getInfo();

  return (
    <div className="tool-header">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};
