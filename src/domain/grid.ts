import type { GridCell, GridSpec } from './types';
import { gridColLon, gridRowLat, metersToLat, metersToLon } from './geo';

export const createGridSpec = (centerLat: number, centerLon: number, sizeKm: number, cellSizeMeters: number): GridSpec => {
  const halfMeters = (sizeKm * 1000) / 2;
  const dLat = metersToLat(cellSizeMeters);
  const rows = Math.round((halfMeters * 2) / cellSizeMeters);
  const minLat = centerLat - (rows * dLat) / 2;
  const dLonAtCenter = metersToLon(cellSizeMeters, centerLat);
  const cols = Math.round((halfMeters * 2) / cellSizeMeters);
  const minLon = centerLon - (cols * dLonAtCenter) / 2;
  return {
    minLat,
    minLon,
    rows,
    cols,
    cellSizeMeters
  };
};

export const buildGridCells = (grid: GridSpec): GridCell[] => {
  const cells: GridCell[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    const lat = gridRowLat(grid, row);
    for (let col = 0; col < grid.cols; col += 1) {
      cells.push({
        row,
        col,
        centerLat: lat,
        centerLon: gridColLon(grid, row, col)
      });
    }
  }
  return cells;
};

export const cellIndexFromLatLon = (grid: GridSpec, lat: number, lon: number) => {
  const dLat = metersToLat(grid.cellSizeMeters);
  const row = Math.floor((lat - grid.minLat) / dLat);
  if (row < 0 || row >= grid.rows) return null;
  const dLon = metersToLon(grid.cellSizeMeters, gridRowLat(grid, row));
  const col = Math.floor((lon - grid.minLon) / dLon);
  if (col < 0 || col >= grid.cols) return null;
  return { row, col };
};
