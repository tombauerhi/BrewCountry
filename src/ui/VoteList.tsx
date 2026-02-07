import type { Vote } from '../domain/types';
import { beerById } from '../domain/beerCatalog';

const VoteList = ({ votes, onEdit, onDelete }: { votes: Vote[]; onEdit: (vote: Vote) => void; onDelete: (id: string) => void }) => (
  <section className="vote-list">
    <h3>User Votes</h3>
    {votes.length === 0 ? (
      <p>Keine Votes vorhanden.</p>
    ) : (
      <ul>
        {votes.map((vote) => (
          <li key={vote.id}>
            <div>
              <strong>{vote.userId}</strong> — {beerById.get(vote.beerId)?.name}
            </div>
            <div className="button-row">
              <button className="button" type="button" onClick={() => onEdit(vote)}>
                Bearbeiten
              </button>
              <button className="button danger" type="button" onClick={() => onDelete(vote.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default VoteList;
