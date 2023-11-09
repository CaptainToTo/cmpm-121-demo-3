import leaflet from "leaflet";
import luck from "./luck";
import { GeoCoin } from "./coin.ts";

const PIT_SPAWN_PROBABILITY = 0.1;

interface Cell {
  readonly i: number;
  readonly j: number;
  pit: GeoCoin[] | null;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
  }

  private getCanonicalCell(i: number, j: number): Cell {
    const key = [i, j].toString();
    
    if (!(key in this.knownCells)) {
      this.knownCells.set(key, this.buildCell(i, j));
    }

    return this.knownCells.get(key)!;
  }

  private buildCell(i: number, j: number): Cell {
    if (luck([i, j].toString()) > PIT_SPAWN_PROBABILITY) {
      return { i: i, j: j, pit: null };
    }
    const value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    const pit: GeoCoin[] = [];
    for (let g = 0; g < value; g++) {
      pit.push(new GeoCoin(i, j, g));
    }
    return { i: i, j: j, pit: pit };
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell(
      Math.floor(point.lat / this.tileWidth),
      Math.floor(point.lng / this.tileWidth),
    );
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [cell.i, cell.j],
      [cell.i + this.tileWidth, cell.j + this.tileWidth],
    ]);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);

    const latMin: number = Math.floor(originCell.i - this.tileVisibilityRadius);
    const latMax: number = Math.floor(originCell.i + this.tileVisibilityRadius);

    const lngMin: number = Math.floor(originCell.j - this.tileVisibilityRadius);
    const lngMax: number = Math.floor(originCell.j + this.tileVisibilityRadius);

    for (let i = latMin; i < latMax; i++) {
      for (let j = lngMin; j < lngMax; j++) {
        resultCells.push(this.getCanonicalCell(i, j));
      }
    }

    return resultCells;
  }
}
