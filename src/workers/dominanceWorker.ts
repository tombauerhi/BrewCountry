import type { DominanceCell, GridSpec, Region, Vote } from '../domain/types';
import { gridColLon, gridCornerLat, gridCornerLon, gridRowLat, haversineDistanceKm, metersToLat, metersToLon } from '../domain/geo';

export type DominanceRequest = {
  grid: GridSpec;
  votes: Vote[];
  radiusKm: number;
  beerIds: string[];
};

export type DominanceResponse = {
  cells: DominanceCell[];
  regions: Region[];
};

const computeDominance = (grid: GridSpec, votes: Vote[], radiusKm: number, beerIds: string[]): DominanceCell[] => {
  const cellCount = grid.rows * grid.cols;
  if (votes.length === 0) {
    return Array.from({ length: cellCount }, () => ({
      winnerBeerId: null,
      winnerCount: 0,
      totalCount: 0,
      newestTimestamp: null
    }));
  }

  const beerIndex = new Map(beerIds.map((id, index) => [id, index]));
  const radiusLat = metersToLat(radiusKm * 1000);

  const cells: DominanceCell[] = new Array(cellCount);
  for (let row = 0; row < grid.rows; row += 1) {
    const lat = gridRowLat(grid, row);
    const radiusLon = metersToLon(radiusKm * 1000, lat);
    for (let col = 0; col < grid.cols; col += 1) {
      const centerLon = gridColLon(grid, row, col);
      const counts = new Array(beerIds.length).fill(0);
      const newest = new Array(beerIds.length).fill(0);
      let total = 0;
      votes.forEach((vote) => {
        if (Math.abs(vote.lat - lat) > radiusLat || Math.abs(vote.lon - centerLon) > radiusLon) {
          return;
        }
        const distance = haversineDistanceKm(lat, centerLon, vote.lat, vote.lon);
        if (distance <= radiusKm) {
          const idx = beerIndex.get(vote.beerId);
          if (idx === undefined) return;
          counts[idx] += 1;
          newest[idx] = Math.max(newest[idx], vote.timestamp);
          total += 1;
        }
      });
      let winnerBeerId: string | null = null;
      let winnerCount = 0;
      let winnerNewest = 0;
      counts.forEach((count, index) => {
        if (count === 0) return;
        const candidateNewest = newest[index];
        if (count > winnerCount || (count === winnerCount && candidateNewest > winnerNewest)) {
          winnerCount = count;
          winnerNewest = candidateNewest;
          winnerBeerId = beerIds[index];
        }
      });
      const index = row * grid.cols + col;
      cells[index] = {
        winnerBeerId,
        winnerCount,
        totalCount: total,
        newestTimestamp: winnerBeerId ? winnerNewest : null
      };
    }
  }
  return cells;
};

type EdgePoint = { row: number; col: number };

const edgeKey = (a: EdgePoint, b: EdgePoint) => {
  if (a.row < b.row || (a.row === b.row && a.col <= b.col)) {
    return `${a.row},${a.col}|${b.row},${b.col}`;
  }
  return `${b.row},${b.col}|${a.row},${a.col}`;
};

const findRegions = (grid: GridSpec, cells: DominanceCell[]): Region[] => {
  const regions: Region[] = [];
  const visited = new Array(cells.length).fill(false);
  const rows = grid.rows;
  const cols = grid.cols;

  const cellIndex = (row: number, col: number) => row * cols + col;
  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = cellIndex(row, col);
      if (visited[index]) continue;
      const beerId = cells[index].winnerBeerId;
      if (!beerId) continue;

      const queue: { row: number; col: number }[] = [{ row, col }];
      visited[index] = true;
      const component: { row: number; col: number }[] = [];
      let sumLat = 0;
      let sumLon = 0;
      let totalVotes = 0;
      let winnerVotes = 0;

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentIndex = cellIndex(current.row, current.col);
        component.push(current);
        const centerLat = gridRowLat(grid, current.row);
        const centerLon = gridColLon(grid, current.row, current.col);
        sumLat += centerLat;
        sumLon += centerLon;
        totalVotes += cells[currentIndex].totalCount;
        winnerVotes += cells[currentIndex].winnerCount;

        neighbors.forEach(([dr, dc]) => {
          const nr = current.row + dr;
          const nc = current.col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
          const nIndex = cellIndex(nr, nc);
          if (visited[nIndex]) return;
          if (cells[nIndex].winnerBeerId !== beerId) return;
          visited[nIndex] = true;
          queue.push({ row: nr, col: nc });
        });
      }

      const edges = new Map<string, { a: EdgePoint; b: EdgePoint }>();
      component.forEach((cell) => {
        const topLeft = { row: cell.row, col: cell.col };
        const topRight = { row: cell.row, col: cell.col + 1 };
        const bottomLeft = { row: cell.row + 1, col: cell.col };
        const bottomRight = { row: cell.row + 1, col: cell.col + 1 };
        const edgePairs: [EdgePoint, EdgePoint][] = [
          [topLeft, topRight],
          [topRight, bottomRight],
          [bottomRight, bottomLeft],
          [bottomLeft, topLeft]
        ];
        edgePairs.forEach(([a, b]) => {
          const key = edgeKey(a, b);
          if (edges.has(key)) {
            edges.delete(key);
          } else {
            edges.set(key, { a, b });
          }
        });
      });

      const adjacency = new Map<string, EdgePoint[]>();
      edges.forEach(({ a, b }) => {
        const aKey = `${a.row},${a.col}`;
        const bKey = `${b.row},${b.col}`;
        adjacency.set(aKey, (adjacency.get(aKey) ?? []).concat(b));
        adjacency.set(bKey, (adjacency.get(bKey) ?? []).concat(a));
      });

      const visitedEdges = new Set<string>();
      const loops: EdgePoint[][] = [];
      edges.forEach(({ a, b }) => {
        const key = edgeKey(a, b);
        if (visitedEdges.has(key)) return;
        const loop: EdgePoint[] = [];
        let current = a;
        let previous: EdgePoint | null = null;
        for (let guard = 0; guard < edges.size + 5; guard += 1) {
          loop.push(current);
          const neighbors = adjacency.get(`${current.row},${current.col}`) ?? [];
          const next = neighbors.find((point) => !previous || point.row !== previous.row || point.col !== previous.col) ?? neighbors[0];
          if (!next) break;
          const edge = edgeKey(current, next);
          visitedEdges.add(edge);
          previous = current;
          current = next;
          if (current.row === a.row && current.col === a.col) {
            break;
          }
        }
        if (loop.length > 2) {
          loops.push(loop);
        }
      });

      const boundary = loops.sort((a, b) => b.length - a.length)[0] ?? [];
      const polygon: [number, number][] = boundary.map((point) => {
        const lat = gridCornerLat(grid, point.row);
        const lon = gridCornerLon(grid, point.row, point.col);
        return [lat, lon];
      });

      const centroid = {
        lat: sumLat / component.length,
        lon: sumLon / component.length
      };

      regions.push({
        id: `${beerId}-${row}-${col}`,
        beerId,
        cells: component,
        polygon,
        centroid,
        totalCells: component.length,
        totalVotes,
        winnerCount: winnerVotes
      });
    }
  }

  return regions;
};

self.onmessage = (event: MessageEvent<DominanceRequest>) => {
  const { grid, votes, radiusKm, beerIds } = event.data;
  const cells = computeDominance(grid, votes, radiusKm, beerIds);
  const regions = findRegions(grid, cells);
  const response: DominanceResponse = { cells, regions };
  self.postMessage(response);
};
