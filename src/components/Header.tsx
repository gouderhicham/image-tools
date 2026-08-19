import React from 'react';

interface HeaderProps {
  activeTab: 'compress' | 'crop' | 'remove-bg';
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'compress':
        return 'Image Compressor';
      case 'crop':
        return 'Image Cropper';
      case 'remove-bg':
        return 'Background Remover';
    }
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'compress':
        return 'Compress images to your exact target file size without losing visible quality';
      case 'crop':
        return 'Crop and frame your image with a moveable selection box';
      case 'remove-bg':
        return 'Calculation-based exact background removal with Magic Wand & surgical brushes';
    }
  };

  return (
    <header className="header">
      <h1>{getTitle()}</h1>
      <p>{getDescription()}</p>
    </header>
  );
};
