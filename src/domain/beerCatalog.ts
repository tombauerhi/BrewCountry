import type { Beer } from './types';

const createLogoDataUri = (label: string, color: string) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="18" fill="${color}" />
  <rect x="8" y="8" width="104" height="104" rx="14" fill="white" opacity="0.15" />
  <text x="60" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#111">
    ${label}
  </text>
  <text x="60" y="82" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#222">
    Brew Country
  </text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const beerCatalog: Beer[] = [
  { id: 'augustiner', name: 'Augustiner', color: '#C75C3D', svgLogoPath: createLogoDataUri('AUG', '#C75C3D') },
  { id: 'paulaner', name: 'Paulaner', color: '#2C3E50', svgLogoPath: createLogoDataUri('PAU', '#2C3E50') },
  { id: 'hofbraeu', name: 'Hofbräu', color: '#1F6FEB', svgLogoPath: createLogoDataUri('HOF', '#1F6FEB') },
  { id: 'loewenbraeu', name: 'Löwenbräu', color: '#F39C12', svgLogoPath: createLogoDataUri('LOE', '#F39C12') },
  { id: 'spaten', name: 'Spaten', color: '#8E44AD', svgLogoPath: createLogoDataUri('SPA', '#8E44AD') },
  { id: 'hacker', name: 'Hacker-Pschorr', color: '#27AE60', svgLogoPath: createLogoDataUri('HAC', '#27AE60') },
  { id: 'weihenstephan', name: 'Weihenstephaner', color: '#E74C3C', svgLogoPath: createLogoDataUri('WEI', '#E74C3C') },
  { id: 'erdinger', name: 'Erdinger', color: '#34495E', svgLogoPath: createLogoDataUri('ERD', '#34495E') },
  { id: 'tegernseer', name: 'Tegernseer', color: '#16A085', svgLogoPath: createLogoDataUri('TEG', '#16A085') },
  { id: 'schweiger', name: 'Schweiger', color: '#D35400', svgLogoPath: createLogoDataUri('SCH', '#D35400') }
];

export const beerById = new Map(beerCatalog.map((beer) => [beer.id, beer]));
