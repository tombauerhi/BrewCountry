import { useEffect, useMemo, useRef, useState } from 'react';
import type { DominanceCell, GridSpec, Region, Vote } from '../domain/types';
import { beerById, beerCatalog } from '../domain/beerCatalog';
import { cellIndexFromLatLon, createGridSpec } from '../domain/grid';
import { voteStore, getCurrentUserId, setCurrentUserId } from '../storage/voteStore';
import MapView from './MapView';
import SimulationPanel from './SimulationPanel';
import VoteEditor from './VoteEditor';
import VoteList from './VoteList';
import Legend from './Legend';

const CENTER_MUNICH: [number, number] = [48.1351, 11.582];
const GRID_SIZE_KM = 100;
const CELL_SIZE_METERS = 500;
const RADIUS_KM = 20;

const App = () => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [cells, setCells] = useState<DominanceCell[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentUserId, setCurrentUser] = useState(getCurrentUserId());
  const [activeVote, setActiveVote] = useState<Vote | null>(null);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const grid = useMemo<GridSpec>(() => createGridSpec(CENTER_MUNICH[0], CENTER_MUNICH[1], GRID_SIZE_KM, CELL_SIZE_METERS), []);
  const beerIds = useMemo(() => beerCatalog.map((beer) => beer.id), []);

  useEffect(() => {
    voteStore.getVotes().then(setVotes);
  }, []);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/dominanceWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (event: MessageEvent<{ cells: DominanceCell[]; regions: Region[] }>) => {
        setCells(event.data.cells);
        setRegions(event.data.regions);
      };
    }
    workerRef.current.postMessage({
      grid,
      votes,
      radiusKm: RADIUS_KM,
      beerIds
    });
  }, [grid, votes, beerIds]);

  const handleSaveVote = async (vote: Vote) => {
    await voteStore.upsertVote(vote);
    const updated = await voteStore.getVotes();
    setVotes(updated);
    setActiveVote(null);
  };

  const handleDeleteVote = async (id: string) => {
    await voteStore.deleteVote(id);
    const updated = await voteStore.getVotes();
    setVotes(updated);
    if (activeVote?.id === id) {
      setActiveVote(null);
    }
  };

  const handleClearVotes = async () => {
    await voteStore.clearVotes();
    setVotes([]);
    setActiveVote(null);
  };

  const onMapClick = (lat: number, lon: number) => {
    const existing = votes.find((vote) => vote.userId === currentUserId);
    const base: Vote = existing ?? {
      id: existing?.id ?? crypto.randomUUID(),
      userId: currentUserId,
      lat,
      lon,
      beerId: beerCatalog[0].id,
      timestamp: Date.now()
    };
    setActiveVote({ ...base, lat, lon });
  };

  const onCellInspect = (lat: number, lon: number) => {
    const index = cellIndexFromLatLon(grid, lat, lon);
    if (!index) {
      setSelectedCellIndex(null);
      return;
    }
    setSelectedCellIndex(index.row * grid.cols + index.col);
  };

  const handleUserChange = (value: string) => {
    setCurrentUserId(value);
    setCurrentUser(value);
  };

  const selectedCell = selectedCellIndex !== null ? cells[selectedCellIndex] : null;
  const selectedBeer = selectedCell?.winnerBeerId ? beerById.get(selectedCell.winnerBeerId) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Brew Country</h1>
          <p>Dominante Biersorten per User-Vote in München (100 km Raster)</p>
        </div>
        <div className="user-controls">
          <label>
            User-ID
            <input
              value={currentUserId}
              onChange={(event) => handleUserChange(event.target.value)}
              className="input"
            />
          </label>
          <span className="hint">Einfache Demo-Authentifizierung via User-ID.</span>
        </div>
      </header>
      <main className="app-main">
        <section className="map-panel">
          <MapView
            center={CENTER_MUNICH}
            grid={grid}
            cells={cells}
            regions={regions}
            votes={votes}
            onMapClick={onMapClick}
            onCellInspect={onCellInspect}
            selectedCellIndex={selectedCellIndex}
          />
        </section>
        <aside className="side-panel">
          <Legend />
          <VoteEditor
            activeVote={activeVote}
            currentUserId={currentUserId}
            onSave={handleSaveVote}
            onClear={handleClearVotes}
            votes={votes}
            onSelectVote={setActiveVote}
            onDeleteCurrent={handleDeleteVote}
          />
          <SimulationPanel
            grid={grid}
            votes={votes}
            onAddVotes={async (newVotes) => {
              for (const vote of newVotes) {
                await voteStore.upsertVote(vote);
              }
              const updated = await voteStore.getVotes();
              setVotes(updated);
            }}
            onClearVotes={handleClearVotes}
          />
          <VoteList
            votes={votes}
            onEdit={(vote) => setActiveVote(vote)}
            onDelete={(voteId) => handleDeleteVote(voteId)}
          />
          <section className="cell-info">
            <h3>Cell-Info</h3>
            {selectedCell && selectedBeer ? (
              <div className="cell-details">
                <img src={selectedBeer.svgLogoPath} alt={selectedBeer.name} />
                <div>
                  <div className="title">{selectedBeer.name}</div>
                  <div>
                    Stimmen: {selectedCell.winnerCount}/{selectedCell.totalCount}
                  </div>
                </div>
              </div>
            ) : (
              <p>Keine Daten für diese Zelle.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
};

export default App;
