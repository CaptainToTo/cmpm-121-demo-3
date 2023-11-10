import leaflet from "leaflet";
import luck from "./luck";
import { GeoCoin } from "./coin";
import { Player } from "./player";

const PIT_SPAWN_PROBABILITY = 0.1;

export interface Cell {
  readonly i: number;
  readonly j: number;
  pit: GeoCoin[] | null;
  popup: HTMLDivElement | null;
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

  map: HTMLElement;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    Board.instance = this;
    this.map = document.querySelector<HTMLElement>("#map")!;
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
    this.curCell = null;
  }

  private static getKey(i: number, j: number): string {
    return [i, j].toString();
  }

  private getCanonicalCell(i: number, j: number): Cell {
    const key = Board.getKey(i, j);

    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, this.buildCell(i, j));
    }

    return this.knownCells.get(key)!;
  }

  private buildCell(i: number, j: number): Cell {
    if (luck(Board.getKey(i, j)) > PIT_SPAWN_PROBABILITY) {
      return { i: i, j: j, pit: null, popup: null };
    }

    const save = localStorage.getItem(Board.getKey(i, j));

    if (save !== null) {
      const coinsStrs = JSON.parse(save) as string[];
      const coins: GeoCoin[] = [];
      coinsStrs.forEach((coinStr) => coins.push(GeoCoin.parseString(coinStr)));
      return { i: i, j: j, pit: coins, popup: null };
    }

    const value = Math.floor(luck(Board.getKey(i, j)) * 100);
    const pit: GeoCoin[] = [];
    for (let g = 0; g < value; g++) {
      pit.push(new GeoCoin(i, j, g));
    }
    return { i: i, j: j, pit: pit, popup: null };
  }

  saveCell(i: number, j: number) {
    const cell: Cell = this.getCanonicalCell(i, j);
    const save: string[] = [];
    cell.pit!.forEach((coin) => {
      save.push(coin.toString());
    });
    localStorage.setItem(Board.getKey(i, j), JSON.stringify(save));
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
    this.map.dispatchEvent(new Event("redraw"));

    const cells = this.getCellsNearPoint(point);

    cells.forEach((cell) => {
      const bounds = this.getCellBounds(cell);
      const pit = leaflet.rectangle(bounds) as leaflet.Layer;

      pit.bindPopup(() => {
        cell.popup = document.createElement("div");
        cell.popup.style.maxHeight = "200px";
        cell.popup.style.overflow = "auto";

        cell.popup.innerHTML = `<div>There is a pit here at "${cell.i},${
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
              Player.getInstance().saveCoins();
              cell.pit!.splice(cell.pit!.indexOf(coin), 1);
              button.style.display = "none";
              cell.popup!.querySelector<HTMLSpanElement>(
                "#value"
              )!.innerHTML = `${cell.pit!.length}`;
              Board.getInstance().saveCell(cell.i, cell.j);
            });
            cell.popup!.append(button);
          });
        }

        return cell.popup;
      });

      pit.addEventListener("popupopen", () => {
        Board.getInstance().curCell = cell;
      });

      pit.addEventListener("popupclose", () => {
        if (Board.getInstance().curCell === cell) {
          Board.getInstance().curCell = null;
        }
      });

      Board.getInstance().map.addEventListener("redraw", () => {
        pit?.remove();
      });

      pit.addTo(map);
    });
  }
}
