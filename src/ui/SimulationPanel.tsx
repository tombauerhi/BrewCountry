import { useState } from 'react';
import type { GridSpec, Vote } from '../domain/types';
import { beerCatalog } from '../domain/beerCatalog';
import { gridColLon, gridRowLat } from '../domain/geo';

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const randomVotes = (grid: GridSpec, count: number, seed?: number): Vote[] => {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;
  const votes: Vote[] = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(rng() * grid.rows);
    const col = Math.floor(rng() * grid.cols);
    const lat = gridRowLat(grid, row) + (rng() - 0.5) * (grid.cellSizeMeters / 111_320);
    const lon = gridColLon(grid, row, col) + (rng() - 0.5) * (grid.cellSizeMeters / (111_320 * Math.cos((lat * Math.PI) / 180)));
    const beer = beerCatalog[Math.floor(rng() * beerCatalog.length)];
    votes.push({
      id: crypto.randomUUID(),
      userId: `sim-${Math.floor(rng() * 9999)}`,
      lat,
      lon,
      beerId: beer.id,
      timestamp: Date.now() - Math.floor(rng() * 1000 * 60 * 60 * 24)
    });
  }
  return votes;
};

const SimulationPanel = ({
  grid,
  votes,
  onAddVotes,
  onClearVotes
}: {
  grid: GridSpec;
  votes: Vote[];
  onAddVotes: (votes: Vote[]) => void;
  onClearVotes: () => void;
}) => {
  const [count, setCount] = useState(100);
  const [seed, setSeed] = useState('');

  const handleGenerate = () => {
    const seedValue = seed ? Number(seed) : undefined;
    onAddVotes(randomVotes(grid, count, seedValue));
  };

  return (
    <section className="simulation">
      <h3>Simulation</h3>
      <div className="form-grid">
        <label>
          Anzahl
          <input
            className="input"
            type="number"
            min={1}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
        <label>
          Seed (optional)
          <input className="input" value={seed} onChange={(event) => setSeed(event.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="button primary" onClick={handleGenerate}>
          Generate random users
        </button>
        <button type="button" className="button" onClick={() => onAddVotes(randomVotes(grid, 1))}>
          Add 1 random vote
        </button>
        <button type="button" className="button danger" onClick={onClearVotes}>
          Clear all votes ({votes.length})
        </button>
      </div>
    </section>
  );
};

export default SimulationPanel;
