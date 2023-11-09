import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
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

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    
    if (!(key in this.knownCells)) {
      this.knownCells.set(key, cell);
    }

    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: Math.floor(point.lat / this.tileWidth),
      j: Math.floor(point.lng / this.tileWidth),
    });
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
        resultCells.push(this.getCanonicalCell({ i: i, j: j }));
      }
    }

    return resultCells;
  }
}
