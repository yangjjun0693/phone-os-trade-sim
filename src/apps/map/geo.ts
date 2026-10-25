/**
 * Minimal Web-Mercator helpers for the OpenStreetMap tile layer.
 *
 * Only the maths we need: lat/lng <-> world pixels at a given zoom, tile URLs,
 * and a conversion from the fictional city's canvas coordinates to real
 * lat/lng so the game pins land on top of real OSM roads.
 */
import { MAP_H, MAP_W } from '@/data/places';

export const TILE_SIZE = 256;

export const MIN_ZOOM = 12;
export const MAX_ZOOM = 18;

/** Where the fictional city sits on the real map (Seoul). */
export const CITY_CENTER = { lat: 37.5665, lng: 126.978 };

/** How many real metres one unit of the 400x560 game canvas covers. */
export const METERS_PER_UNIT = 12;

export function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

export function latToWorldY(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return y * TILE_SIZE * 2 ** zoom;
}

export function worldXToLng(x: number, zoom: number): number {
  return (x / (TILE_SIZE * 2 ** zoom)) * 360 - 180;
}

export function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Ground resolution in metres per screen pixel. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function tileUrl(zoom: number, x: number, y: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

/** Fictional canvas coordinate -> real lat/lng around the city centre. */
export function placeLatLng(x: number, y: number): { lat: number; lng: number } {
  const east = (x - MAP_W / 2) * METERS_PER_UNIT;
  const north = (MAP_H / 2 - y) * METERS_PER_UNIT;
  const lat = CITY_CENTER.lat + north / 111320;
  const lng = CITY_CENTER.lng + east / (111320 * Math.cos((CITY_CENTER.lat * Math.PI) / 180));
  return { lat, lng };
}
