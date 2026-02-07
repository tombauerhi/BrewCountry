import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DominanceCell, GridSpec, Region } from '../../domain/types';
import { beerById } from '../../domain/beerCatalog';
import { gridCornerLat, gridCornerLon } from '../../domain/geo';

const CanvasOverlay = ({ grid, cells, regions }: { grid: GridSpec; cells: DominanceCell[]; regions: Region[] }) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'dominance-canvas') as HTMLCanvasElement;
    const overlayPane = map.getPanes().overlayPane;
    overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    const draw = () => {
      if (!canvasRef.current) return;
      const size = map.getSize();
      const bounds = map.getBounds();
      canvasRef.current.width = size.x;
      canvasRef.current.height = size.y;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size.x, size.y);
      ctx.globalAlpha = 0.35;

      regions.forEach((region) => {
        const beer = beerById.get(region.beerId);
        if (!beer || region.polygon.length < 3) return;
        const anyPoint = region.polygon.find(([lat, lon]) => bounds.contains([lat, lon]));
        if (!anyPoint) return;
        ctx.beginPath();
        region.polygon.forEach(([lat, lon], index) => {
          const point = map.latLngToContainerPoint([lat, lon]);
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = beer.color;
        ctx.fill();
      });

      if (regions.length === 0) {
        for (let row = 0; row < grid.rows; row += 1) {
          for (let col = 0; col < grid.cols; col += 1) {
            const index = row * grid.cols + col;
            const cell = cells[index];
            if (!cell?.winnerBeerId) continue;
            const beer = beerById.get(cell.winnerBeerId);
            if (!beer) continue;
            const topLeft = map.latLngToContainerPoint([gridCornerLat(grid, row), gridCornerLon(grid, row, col)]);
            const bottomRight = map.latLngToContainerPoint([
              gridCornerLat(grid, row + 1),
              gridCornerLon(grid, row + 1, col + 1)
            ]);
            ctx.fillStyle = beer.color;
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    draw();
    map.on('moveend', draw);
    map.on('zoomend', draw);
    map.on('resize', draw);

    return () => {
      map.off('moveend', draw);
      map.off('zoomend', draw);
      map.off('resize', draw);
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
    };
  }, [map, grid, cells, regions]);

  return null;
};

export default CanvasOverlay;
