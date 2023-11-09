import leaflet from "leaflet";
import { GeoCoin } from "./coin";

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
        console.log(coin.toString());
      });
      this.statusPanel.append(button);
    });
  }

  addCoin(coin: GeoCoin) {
    this.coins.push(coin);
    this.updateStatusPanel();
  }
}
