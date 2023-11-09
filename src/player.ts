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

  constructor(map: leaflet.Map, startPos: leaflet.LatLng) {
    Player.instance = this;
    this.map = map;

    this.position = startPos;
    this.marker = leaflet.marker(startPos);
    this.marker.bindTooltip("That's you!");
    this.marker.addTo(map);

    this.coins = [];

    this.statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
    this.statusPanel.style.maxHeight = "150px";
    this.statusPanel.style.overflow = "auto";
    this.updateStatusPanel();
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
            curCell.popup!.querySelector<HTMLSpanElement>("#value")!.innerHTML = `${curCell.pit!.length}`;
          });
          curCell.popup!.append(newButton);

          curCell.popup!.querySelector<HTMLSpanElement>("#value")!.innerHTML = `${curCell.pit!.length}`;

          this.coins.splice(this.coins.indexOf(coin), 1);
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
}
