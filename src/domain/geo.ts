import type { GridSpec } from './types';

export const EARTH_RADIUS_KM = 6371;

export const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export const metersToLat = (meters: number) => meters / 111_320;

export const metersToLon = (meters: number, lat: number) => meters / (111_320 * Math.cos((lat * Math.PI) / 180));

export const centerToBoundingBox = (lat: number, lon: number, sizeKm: number) => {
  const halfMeters = (sizeKm * 1000) / 2;
  const dLat = metersToLat(halfMeters);
  const dLon = metersToLon(halfMeters, lat);
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLon: lon - dLon,
    maxLon: lon + dLon
  };
};

export const gridRowLat = (grid: GridSpec, row: number) => {
  const dLat = metersToLat(grid.cellSizeMeters);
  return grid.minLat + (row + 0.5) * dLat;
};

export const gridColLon = (grid: GridSpec, row: number, col: number) => {
  const lat = gridRowLat(grid, row);
  const dLon = metersToLon(grid.cellSizeMeters, lat);
  return grid.minLon + (col + 0.5) * dLon;
};

export const gridCornerLat = (grid: GridSpec, rowLine: number) => {
  const dLat = metersToLat(grid.cellSizeMeters);
  return grid.minLat + rowLine * dLat;
};

export const gridCornerLon = (grid: GridSpec, rowLine: number, colLine: number) => {
  const lat = gridCornerLat(grid, rowLine);
  const dLon = metersToLon(grid.cellSizeMeters, lat);
  return grid.minLon + colLine * dLon;
};
