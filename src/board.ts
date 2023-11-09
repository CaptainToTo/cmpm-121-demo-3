import leaflet from "leaflet";
import luck from "./luck";
import { GeoCoin } from "./coin";
import { Player } from "./player";

const PIT_SPAWN_PROBABILITY = 0.1;

export interface Cell {
  readonly i: number;
  readonly j: number;
  pit: GeoCoin[] | null;
}

export class Board {
  static instance: Board;
  static getInstance(): Board {
    return Board.instance;
  }

  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  curCell: Cell | null;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    Board.instance = this;
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
    this.curCell = null;
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
      Math.floor(point.lng / this.tileWidth)
    );
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [cell.i * this.tileWidth, cell.j * this.tileWidth],
      [(cell.i + 1) * this.tileWidth, (cell.j + 1) * this.tileWidth],
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
        const cell = this.getCanonicalCell(i, j);
        if (cell.pit !== null) {
          resultCells.push(this.getCanonicalCell(i, j));
        }
      }
    }

    return resultCells;
  }

  drawPits(point: leaflet.LatLng, map: leaflet.Map) {
    const cells = this.getCellsNearPoint(point);

    cells.forEach((cell) => {
      const bounds = this.getCellBounds(cell);
      const pit = leaflet.rectangle(bounds) as leaflet.Layer;

      pit.bindPopup(() => {
        const container = document.createElement("div");
        container.style.maxHeight = "200px";
        container.style.overflow = "auto";

        container.innerHTML = `<div>There is a pit here at "${cell.i},${
          cell.j
        }". It has <span id="value">${
          cell.pit?.length ?? 0
        }</span> coins.</div>`;
        
        if (cell.pit !== null) {
          cell.pit.forEach((coin) => {
            const button = document.createElement("button");
            button.innerHTML = coin.toString();
            button.addEventListener("click", () => {
              Player.getInstance().addCoin(coin);
              cell.pit!.splice(cell.pit!.indexOf(coin), 1);
              button.style.display = "none";
              container.querySelector<HTMLSpanElement>("#value")!.innerHTML = `${cell.pit!.length}`;
            });
            container.append(button);
          });
        }

        return container;
      });

      pit.addEventListener("popupopen", () => {
        Board.getInstance().curCell = cell;
      });

      pit.addEventListener("popupclose", () => {
        if (Board.getInstance().curCell === cell) {
          Board.getInstance().curCell = null;
        }
      });

      pit.addTo(map);
    });
  }
}
