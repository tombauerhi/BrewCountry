import { beerCatalog } from '../domain/beerCatalog';

const Legend = () => (
  <section className="legend">
    <h3>Legende</h3>
    <ul>
      {beerCatalog.map((beer) => (
        <li key={beer.id}>
          <span className="legend-color" style={{ background: beer.color }} />
          <img src={beer.svgLogoPath} alt={beer.name} />
          <span>{beer.name}</span>
        </li>
      ))}
      <li>
        <span className="legend-color empty" />
        <span>Keine Daten</span>
      </li>
    </ul>
  </section>
);

export default Legend;
