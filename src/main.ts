import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import "./leafletWorkaround";
import { Board } from "./board";
import { Player } from "./player";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;

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

const player = new Player(map, MERRILL_CLASSROOM);

const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

board.drawPits(player.position, map);

document.getElementById("north")?.addEventListener("click", () => {
  player.position.lat += board.tileWidth;
  player.marker.setLatLng(player.position);
  board.drawPits(player.position, map);
  map.setView(player.position);
});
document.getElementById("south")?.addEventListener("click", () => {
  player.position.lat -= board.tileWidth;
  player.marker.setLatLng(player.position);
  board.drawPits(player.position, map);
  map.setView(player.position);
});
document.getElementById("east")?.addEventListener("click", () => {
  player.position.lng += board.tileWidth;
  player.marker.setLatLng(player.position);
  board.drawPits(player.position, map);
  map.setView(player.position);
});
document.getElementById("west")?.addEventListener("click", () => {
  player.position.lng -= board.tileWidth;
  player.marker.setLatLng(player.position);
  board.drawPits(player.position, map);
  map.setView(player.position);
});
document.getElementById("reset")?.addEventListener("click", () => {
  if (window.prompt("Do you want to reset? (yes/no)") !== "yes") return;
  localStorage.clear();
  window.location.reload();
});

const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
    navigator.geolocation.watchPosition((position) => {
      player.position = leaflet.latLng(position.coords.latitude, position.coords.longitude);
      player.marker.setLatLng(player.position);
      map.setView(player.position);
      board.drawPits(player.position, map);
    });
});
