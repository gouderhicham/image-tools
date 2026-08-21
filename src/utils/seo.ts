export type AppTab = 'compress' | 'crop' | 'convert' | 'remove-bg';

export interface TabSeoInfo {
  title: string;
  description: string;
  keywords: string;
  hash: string;
  ogTitle: string;
  ogDescription: string;
}

export const TAB_SEO_MAP: Record<AppTab, TabSeoInfo> = {
  compress: {
    title: 'Free Image Compressor & Size Reducer — Image Crop Studio',
    description:
      'Compress JPG, PNG, WebP, and AVIF images online for free. Reduce file weight in KB to your exact target size without visible quality loss.',
    keywords:
      'image compressor, reduce image size, compress jpg, compress png, reduce image kb, compress image to 100kb, online photo compressor',
    hash: 'compress',
    ogTitle: 'Free Image Compressor & Size Reducer — Image Crop Studio',
    ogDescription:
      'Compress images to your exact target KB size without visible quality loss. 100% private browser processing.',
  },
  convert: {
    title: 'Free Universal Image Converter (AVIF, WebP, PNG, JPG, HEIC, SVG, PDF) — Image Crop Studio',
    description:
      'Convert images online for free. Fast, high-fidelity format transformation supporting AVIF, WebP, PNG, JPG, JFIF, HEIC, SVG, ICO, BMP, TIFF, and PDF with 100% privacy.',
    keywords:
      'free image converter, convert heic to jpg, convert png to jpg, webp converter, avif converter, convert image to pdf, favicon generator, svg converter',
    hash: 'convert',
    ogTitle: 'Free Universal Image Converter (AVIF, WebP, PNG, JPG, HEIC, SVG, PDF) — Image Crop Studio',
    ogDescription:
      'Convert between 11+ image formats instantly in your browser at 100% quality with zero server uploads.',
  },
  crop: {
    title: 'Free Image Cropper & Rounded Corners Editor — Image Crop Studio',
    description:
      'Crop images online with aspect ratios (1:1, 4:3, 16:9, Freeform), framing, and real-time independent corner border radius curvature control.',
    keywords:
      'image cropper, crop image online, aspect ratio crop, rounded corner image, circular crop, image framing tool, crop photo free',
    hash: 'crop',
    ogTitle: 'Free Image Cropper & Rounded Corners Editor — Image Crop Studio',
    ogDescription:
      'Crop photos with custom aspect ratios, precision framing, and real-time corner radius control.',
  },
  'remove-bg': {
    title: 'Free AI Background Remover & Transparent PNG Maker — Image Crop Studio',
    description:
      'Remove background from images automatically in your browser with AI segmentation. Create transparent PNG cutouts with zero cloud uploads.',
    keywords:
      'background remover, remove bg free, transparent background, transparent png maker, ai background removal, cut out image background',
    hash: 'remove-bg',
    ogTitle: 'Free AI Background Remover & Transparent PNG Maker — Image Crop Studio',
    ogDescription:
      'Automatic salient object extraction with surgical alpha matte refinement. 100% free and private.',
  },
};

/**
 * Parses initial active tab from window.location.hash on load
 */
export function getInitialTabFromHash(): AppTab {
  if (typeof window === 'undefined') return 'compress';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash === 'convert') return 'convert';
  if (hash === 'crop') return 'crop';
  if (hash === 'remove-bg' || hash === 'removebg' || hash === 'bg') return 'remove-bg';
  return 'compress';
}

/**
 * Dynamically updates document title, meta tags, and URL hash when switching tools
 */
export function updateDocumentSeo(activeTab: AppTab): void {
  if (typeof document === 'undefined') return;

  const seo = TAB_SEO_MAP[activeTab];
  if (!seo) return;

  // 1. Update Document Title
  document.title = seo.title;

  // 2. Update Primary Meta Tags
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', seo.description);

  const metaTitle = document.querySelector('meta[name="title"]');
  if (metaTitle) metaTitle.setAttribute('content', seo.title);

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) metaKeywords.setAttribute('content', seo.keywords);

  // 3. Update Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', seo.ogTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', seo.ogDescription);

  // 4. Update Twitter Tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', seo.ogTitle);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', seo.ogDescription);

  // 5. Update Canonical Link
  const canonicalLink = document.getElementById('canonical-link');
  const baseCanonical = 'https://image-crop-studio.vercel.app/';
  const newCanonical = activeTab === 'compress' ? baseCanonical : `${baseCanonical}#${seo.hash}`;
  if (canonicalLink) canonicalLink.setAttribute('href', newCanonical);

  // 6. Sync URL Hash without triggering scroll jump
  const targetHash = `#${seo.hash}`;
  if (window.location.hash !== targetHash) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.location.hash = targetHash;
    }
  }
}
