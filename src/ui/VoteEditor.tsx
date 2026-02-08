import { useEffect, useState } from 'react';
import type { Vote } from '../domain/types';
import { beerCatalog } from '../domain/beerCatalog';

const VoteEditor = ({
  activeVote,
  currentUserId,
  onSave,
  onClear,
  votes,
  onSelectVote,
  onDeleteCurrent
}: {
  activeVote: Vote | null;
  currentUserId: string;
  onSave: (vote: Vote) => void;
  onClear: () => void;
  votes: Vote[];
  onSelectVote: (vote: Vote | null) => void;
  onDeleteCurrent: (voteId: string) => void;
}) => {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [beerId, setBeerId] = useState(beerCatalog[0].id);

  useEffect(() => {
    if (!activeVote) return;
    setLat(activeVote.lat.toFixed(6));
    setLon(activeVote.lon.toFixed(6));
    setBeerId(activeVote.beerId);
  }, [activeVote]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) return;
    const baseVote = activeVote ?? {
      id: crypto.randomUUID(),
      userId: currentUserId,
      lat: parsedLat,
      lon: parsedLon,
      beerId,
      timestamp: Date.now()
    };
    onSave({
      ...baseVote,
      userId: currentUserId,
      lat: parsedLat,
      lon: parsedLon,
      beerId,
      timestamp: Date.now()
    });
  };

  const currentUserVote = votes.find((vote) => vote.userId === currentUserId);

  return (
    <section className="vote-editor">
      <h3>Vote bearbeiten</h3>
      <p>Setze deinen Standort per Kartenklick oder manuell.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Latitude
          <input className="input" value={lat} onChange={(event) => setLat(event.target.value)} />
        </label>
        <label>
          Longitude
          <input className="input" value={lon} onChange={(event) => setLon(event.target.value)} />
        </label>
        <label>
          Biersorte
          <select className="input" value={beerId} onChange={(event) => setBeerId(event.target.value)}>
            {beerCatalog.map((beer) => (
              <option key={beer.id} value={beer.id}>
                {beer.name}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button type="submit" className="button primary">
            Vote speichern
          </button>
          <button type="button" className="button" onClick={() => onSelectVote(null)}>
            Abbrechen
          </button>
        </div>
      </form>
      <div className="button-row">
        <button
          type="button"
          className="button"
          disabled={!currentUserVote}
          onClick={() => currentUserVote && onSelectVote(currentUserVote)}
        >
          Eigenen Vote laden
        </button>
        <button
          type="button"
          className="button danger"
          disabled={!currentUserVote}
          onClick={() => currentUserVote && onDeleteCurrent(currentUserVote.id)}
        >
          Eigenen Vote löschen
        </button>
        <button type="button" className="button" onClick={onClear}>
          Alle Votes löschen
        </button>
      </div>
    </section>
  );
};

export default VoteEditor;
