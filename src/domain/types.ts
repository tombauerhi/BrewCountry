export type Beer = {
  id: string;
  name: string;
  color: string;
  svgLogoPath: string;
};

export type Vote = {
  id: string;
  userId: string;
  lat: number;
  lon: number;
  beerId: string;
  timestamp: number;
};

export type GridSpec = {
  minLat: number;
  minLon: number;
  rows: number;
  cols: number;
  cellSizeMeters: number;
};

export type GridCell = {
  row: number;
  col: number;
  centerLat: number;
  centerLon: number;
};

export type DominanceCell = {
  winnerBeerId: string | null;
  winnerCount: number;
  totalCount: number;
  newestTimestamp: number | null;
};

export type Region = {
  id: string;
  beerId: string;
  cells: { row: number; col: number }[];
  polygon: [number, number][];
  centroid: { lat: number; lon: number };
  totalCells: number;
  totalVotes: number;
  winnerCount: number;
};
