import leaflet from "leaflet";
import { GeoCoin } from "./coin";
import { Board } from "./board";

export class Player {
  static instance: Player;
  static getInstance(): Player {
    return Player.instance;
  }

  map: leaflet.Map;
  position: leaflet.LatLng;
  marker: leaflet.Marker;
  coins: GeoCoin[];
  statusPanel: HTMLDivElement;

  path: leaflet.Polyline;
  history: leaflet.LatLng[];

  constructor(map: leaflet.Map, startPos: leaflet.LatLng) {
    Player.instance = this;
    this.map = map;

    this.position = startPos;

    const history = this.getHistory();
    if (history === null) {
      this.history = [];
      this.history.push(this.position);
    } else {
      this.history = history;
      this.position = this.history[this.history.length - 1];
    }
    this.path = leaflet.polyline(this.history, { color: "red" }).addTo(this.map);

    this.marker = leaflet.marker(this.position);
    this.marker.bindTooltip("That's you!");
    this.marker.addTo(map);

    this.map.setView(this.position);

    this.coins = [];
    const save = localStorage.getItem("player");
    if (save !== null) {
      const coinStrs = JSON.parse(save) as string[];
      coinStrs.forEach((coinStr) =>
        this.coins.push(GeoCoin.parseString(coinStr))
      );
    }

    this.statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
    this.statusPanel.style.maxHeight = "150px";
    this.statusPanel.style.overflow = "auto";
    this.updateStatusPanel();
  }

  saveCoins() {
    const coinStr: string[] = [];
    this.coins.forEach((coin) => {
      coinStr.push(coin.toString());
    });
    localStorage.setItem("player", JSON.stringify(coinStr));
  }

  updateStatusPanel() {
    if (this.coins.length === 0) {
      this.statusPanel.innerHTML = "No coins yet...";
      return;
    }

    this.statusPanel.innerHTML = "";

    this.coins.forEach((coin) => {
      const button = document.createElement("button");
      button.innerHTML = coin.toString();
      button.addEventListener("click", () => {
        if (Board.getInstance().curCell !== null) {
          const curCell = Board.getInstance().curCell!;
          curCell.pit!.push(coin);

          const newButton = document.createElement("button");
          newButton.innerHTML = coin.toString();
          newButton.addEventListener("click", () => {
            Player.getInstance().addCoin(coin);
            curCell.pit!.splice(curCell.pit!.indexOf(coin), 1);
            newButton.style.display = "none";
            curCell.popup!.querySelector<HTMLSpanElement>(
              "#value"
            )!.innerHTML = `${curCell.pit!.length}`;
            Board.getInstance().saveCell(curCell.i, curCell.j);
          });
          curCell.popup!.append(newButton);

          curCell.popup!.querySelector<HTMLSpanElement>(
            "#value"
          )!.innerHTML = `${curCell.pit!.length}`;

          Board.getInstance().saveCell(curCell.i, curCell.j);

          this.coins.splice(this.coins.indexOf(coin), 1);
          this.saveCoins();
          button.style.display = "none";
        }
      });
      this.statusPanel.append(button);
    });
  }

  addCoin(coin: GeoCoin) {
    this.coins.push(coin);
    this.updateStatusPanel();
  }

  updatePosition(lat: number, lng: number) {
    this.position = leaflet.latLng({
      lat: lat,
      lng: lng,
    });
    this.path.addLatLng(this.position);
    this.history.push(this.position);
    this.saveHistory();
    this.marker.setLatLng(this.position);
    this.map.setView(this.position);
    Board.getInstance().drawPits(this.position, this.map);
  }

  saveHistory() {
    const historyStrs: string[] = [];
    this.history.forEach(coord => {
      historyStrs.push(`${coord.lat}:${coord.lng}`);
    });
    localStorage.setItem("history", JSON.stringify(historyStrs));
  }

  getHistory(): leaflet.LatLng[] | null {
    const save = localStorage.getItem("history");

    if (save === null) {
      return null;
    }

    const historyStrs: string[] = JSON.parse(save) as string[];
    const history: leaflet.LatLng[] = [];
    historyStrs.forEach(str => {
      history.push(Player.parseCoord(str));
    });

    return history;
  }

  static parseCoord(str: string): leaflet.LatLng {
    const tokens = str.split(":");
    return leaflet.latLng({ lat: parseFloat(tokens[0]), lng: parseFloat(tokens[1]) });
  }
}
