import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      // eslint-disable-next-line @typescript-eslint/quotes
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [i * TILE_DEGREES, j * TILE_DEGREES],
    [(i + 1) * TILE_DEGREES, (j + 1) * TILE_DEGREES],
  ]);

  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <button id="poke">poke</button>
                <button id="deposit">deposit</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    poke.addEventListener("click", () => {
      if (value == 0) return;
      value--;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      points++;
      statusPanel.innerHTML = `${points} points accumulated`;
    });
    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (points == 0) return;
      value++;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      points--;
      statusPanel.innerHTML = `${points} points accumulated`;
    });
    return container;
  });
  pit.addTo(map);
}

const latMin: number = Math.floor(
  MERRILL_CLASSROOM.lat / TILE_DEGREES - NEIGHBORHOOD_SIZE,
);
const latMax: number = Math.floor(
  MERRILL_CLASSROOM.lat / TILE_DEGREES + NEIGHBORHOOD_SIZE,
);

const lngMin: number = Math.floor(
  MERRILL_CLASSROOM.lng / TILE_DEGREES - NEIGHBORHOOD_SIZE,
);
const lngMax: number = Math.floor(
  MERRILL_CLASSROOM.lng / TILE_DEGREES + NEIGHBORHOOD_SIZE,
);

for (let i = latMin; i < latMax; i++) {
  for (let j = lngMin; j < lngMax; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  }
}
