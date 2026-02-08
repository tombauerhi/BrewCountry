import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, Polygon, Rectangle, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import type { DominanceCell, GridSpec, Region, Vote } from '../domain/types';
import { beerById, beerCatalog } from '../domain/beerCatalog';
import { centerToBoundingBox, gridCornerLat, gridCornerLon } from '../domain/geo';
import { cellIndexFromLatLon } from '../domain/grid';
import CanvasOverlay from './overlay/CanvasOverlay';

const beerIcons = new Map(
  beerCatalog.map((beer) => [
    beer.id,
    L.divIcon({
      className: 'beer-marker',
      html: `<div class="beer-dot" style="background:${beer.color}"></div>`,
      iconSize: [14, 14]
    })
  ])
);

const MapPopupHandler = ({
  grid,
  cells,
  onCellInspect,
  onMapClick
}: {
  grid: GridSpec;
  cells: DominanceCell[];
  onCellInspect: (lat: number, lon: number) => void;
  onMapClick: (lat: number, lon: number) => void;
}) => {
  const map = useMap();
  useMapEvent('click', (event) => {
    onMapClick(event.latlng.lat, event.latlng.lng);
    onCellInspect(event.latlng.lat, event.latlng.lng);
    const index = cellIndexFromLatLon(grid, event.latlng.lat, event.latlng.lng);
    if (!index) {
      map.closePopup();
      return;
    }
    const cell = cells[index.row * grid.cols + index.col];
    if (!cell || !cell.winnerBeerId) {
      map.closePopup();
      return;
    }
    const beer = beerById.get(cell.winnerBeerId);
    if (!beer) return;
    const content = `
      <div class="popup">
        <img src="${beer.svgLogoPath}" alt="${beer.name}" />
        <div>
          <strong>${beer.name}</strong><br />
          Stimmen: ${cell.winnerCount}/${cell.totalCount}
        </div>
      </div>
    `;
    map.openPopup(content, event.latlng, { closeButton: true });
  });
  return null;
};

const RegionLogoMarkers = ({ regions }: { regions: Region[] }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handler = () => setZoom(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map]);

  if (zoom < 12) return null;
  return (
    <>
      {regions.map((region) => {
        const beer = beerById.get(region.beerId);
        if (!beer || region.totalCells < 6) return null;
        const icon = L.divIcon({
          className: 'region-logo',
          html: `<img src="${beer.svgLogoPath}" alt="${beer.name}" />`,
          iconSize: [36, 36]
        });
        return (
          <Marker key={region.id} position={[region.centroid.lat, region.centroid.lon]} icon={icon} />
        );
      })}
    </>
  );
};

const MapView = ({
  center,
  grid,
  cells,
  regions,
  votes,
  onMapClick,
  onCellInspect,
  selectedCellIndex
}: {
  center: LatLngExpression;
  grid: GridSpec;
  cells: DominanceCell[];
  regions: Region[];
  votes: Vote[];
  onMapClick: (lat: number, lon: number) => void;
  onCellInspect: (lat: number, lon: number) => void;
  selectedCellIndex: number | null;
}) => {
  const bounds = useMemo(() => {
    const box = centerToBoundingBox(center[0] as number, center[1] as number, 100);
    return [
      [box.minLat, box.minLon],
      [box.maxLat, box.maxLon]
    ] as [LatLngExpression, LatLngExpression];
  }, [center]);

  const highlightCellPolygon = useMemo(() => {
    if (selectedCellIndex === null) return null;
    const row = Math.floor(selectedCellIndex / grid.cols);
    const col = selectedCellIndex % grid.cols;
    const topLeft: [number, number] = [gridCornerLat(grid, row), gridCornerLon(grid, row, col)];
    const topRight: [number, number] = [gridCornerLat(grid, row), gridCornerLon(grid, row, col + 1)];
    const bottomRight: [number, number] = [gridCornerLat(grid, row + 1), gridCornerLon(grid, row + 1, col + 1)];
    const bottomLeft: [number, number] = [gridCornerLat(grid, row + 1), gridCornerLon(grid, row + 1, col)];
    return [topLeft, topRight, bottomRight, bottomLeft];
  }, [selectedCellIndex, grid]);

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Rectangle bounds={bounds} pathOptions={{ color: '#444', weight: 1, fill: false }} />
      <CanvasOverlay grid={grid} cells={cells} regions={regions} />
      {highlightCellPolygon && (
        <Polygon positions={highlightCellPolygon as [number, number][]} pathOptions={{ color: '#111', weight: 1 }} />
      )}
      <MapPopupHandler grid={grid} cells={cells} onCellInspect={onCellInspect} onMapClick={onMapClick} />
      {votes.map((vote) => {
        const icon = beerIcons.get(vote.beerId) ?? undefined;
        return (
          <Marker key={vote.id} position={[vote.lat, vote.lon]} icon={icon}>
            <Popup>
              <strong>{beerById.get(vote.beerId)?.name}</strong>
              <br />
              {vote.userId}
            </Popup>
          </Marker>
        );
      })}
      <RegionLogoMarkers regions={regions} />
    </MapContainer>
  );
};

export default MapView;
