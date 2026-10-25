import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Crosshair, Layers, Minus, Plus, X } from 'lucide-react';
import { KIND_LABEL, PLACES, type Place } from '@/data/places';
import { heatLabel, heatTier } from '@/game/heat';
import { isNightHour, patrolLabel, patrolLevel, type PatrolLevel } from '@/game/patrol';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { AppShell } from '../AppShell';
import {
  CITY_CENTER,
  MAX_ZOOM,
  MIN_ZOOM,
  TILE_SIZE,
  latToWorldY,
  lngToWorldX,
  metersPerPixel,
  placeLatLng,
  tileUrl,
  worldXToLng,
  worldYToLat,
} from './geo';

const LEVEL_COLOR: Record<PatrolLevel, string> = {
  low: '#30d158',
  mid: '#ff9f0a',
  high: '#ff453a',
};

/** Patrol zone radius in real metres, per place kind. */
const RING_METERS = { police: 300, default: 200 };

/**
 * Maps — an OpenStreetMap tile view with the game's patrol overlay on top.
 * Tiles come straight from openstreetmap.org (© OpenStreetMap contributors).
 */
export function MapApp() {
  const heat = useGameStore((s) => s.heat);
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const theme = useOSStore((s) => s.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = theme === 'system' ? systemDark : theme === 'dark';

  const hour = new Date(gameDateTime).getHours();

  const [view, setView] = useState({ zoom: 14, ...CITY_CENTER });
  const [size, setSize] = useState({ w: 430, h: 620 });
  const [selected, setSelected] = useState<Place | null>(null);
  const [overlay, setOverlay] = useState(true);

  const frameRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const originRef = useRef({ x: 0, y: 0 });

  // Keep the tile grid matched to the phone viewport.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth || 430, h: el.clientHeight || 620 });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const origin = useMemo(() => {
    const cx = lngToWorldX(view.lng, view.zoom);
    const cy = latToWorldY(view.lat, view.zoom);
    return { x: cx - size.w / 2, y: cy - size.h / 2 };
  }, [view, size.w, size.h]);
  originRef.current = origin;

  const places = useMemo(
    () => PLACES.map((place) => ({ place, geo: placeLatLng(place.x, place.y) })),
    [],
  );

  const toScreen = useMemo(
    () => (lat: number, lng: number) => ({
      x: lngToWorldX(lng, view.zoom) - origin.x,
      y: latToWorldY(lat, view.zoom) - origin.y,
    }),
    [origin, view.zoom],
  );

  const tiles = useMemo(() => {
    const out: { key: string; x: number; y: number; left: number; top: number }[] = [];
    const max = 2 ** view.zoom - 1;
    const startX = Math.floor(origin.x / TILE_SIZE);
    const endX = Math.floor((origin.x + size.w) / TILE_SIZE);
    const startY = Math.max(0, Math.floor(origin.y / TILE_SIZE));
    const endY = Math.min(max, Math.floor((origin.y + size.h) / TILE_SIZE));
    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        out.push({
          key: `${view.zoom}/${x}/${y}`,
          x,
          y,
          left: x * TILE_SIZE - origin.x,
          top: y * TILE_SIZE - origin.y,
        });
      }
    }
    return out;
  }, [origin, size.w, size.h, view.zoom]);

  const bind = useDrag(
    ({ first, tap, offset: [ox, oy], movement: [mx, my] }) => {
      if (Math.hypot(mx, my) > 8) moved.current = true;
      if (tap) return;
      if (first) dragStart.current = { ...originRef.current };
      const start = dragStart.current;
      if (!start) return;
      const x = start.x - ox;
      const y = start.y - oy;
      setView((v) => ({
        ...v,
        lng: worldXToLng(x + size.w / 2, v.zoom),
        lat: worldYToLat(y + size.h / 2, v.zoom),
      }));
    },
    { filterTaps: true, pointer: { touch: true, capture: false } },
  );

  const zoomBy = (delta: number) =>
    setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom + delta)) }));

  const levels = useMemo(
    () =>
      Object.fromEntries(
        PLACES.map((place) => [place.id, patrolLevel(place.base, heat, hour, place.nightlife)]),
      ) as Record<string, PatrolLevel>,
    [heat, hour],
  );

  const clock = `${String(hour).padStart(2, '0')}:${String(
    new Date(gameDateTime).getMinutes(),
  ).padStart(2, '0')}`;

  return (
    <AppShell
      title="Maps"
      className="flex flex-col"
      trailing={
        <button
          type="button"
          onClick={() => setOverlay((value) => !value)}
          aria-pressed={overlay}
          aria-label="순찰 표시 전환"
          className={cn(
            'flex size-9 items-center justify-center rounded-full transition-colors',
            overlay ? 'bg-ios-accent text-white' : 'bg-ios-surface text-ios-muted',
          )}
        >
          <Layers className="size-[18px]" aria-hidden />
        </button>
      }
    >
      <div
        ref={frameRef}
        className="relative h-full min-h-0 touch-none select-none overflow-hidden bg-[#e9e6dc] dark:bg-[#1c1d21]"
        onPointerDownCapture={() => {
          moved.current = false;
        }}
        {...bind()}
      >
        {/* OSM raster tiles */}
        <div
          className="absolute inset-0"
          style={
            dark
              ? { filter: 'invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9)' }
              : undefined
          }
          aria-hidden
        >
          {tiles.map((tile) => (
            <img
              key={tile.key}
              src={tileUrl(view.zoom, tile.x, tile.y)}
              alt=""
              draggable={false}
              loading="lazy"
              className="pointer-events-none absolute size-[256px] select-none"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>

        {/* patrol rings */}
        {overlay
          ? places.map(({ place, geo }) => {
              const pos = toScreen(geo.lat, geo.lng);
              const radius =
                (place.kind === 'police' ? RING_METERS.police : RING_METERS.default) /
                metersPerPixel(geo.lat, view.zoom);
              const color = LEVEL_COLOR[levels[place.id]];
              return (
                <span
                  key={`ring-${place.id}`}
                  className="pointer-events-none absolute rounded-full border"
                  style={{
                    left: pos.x - radius,
                    top: pos.y - radius,
                    width: radius * 2,
                    height: radius * 2,
                    borderColor: `${color}73`,
                    backgroundColor: `${color}2e`,
                  }}
                  aria-hidden
                />
              );
            })
          : null}

        {/* place pins */}
        {places.map(({ place, geo }) => {
          const pos = toScreen(geo.lat, geo.lng);
          const active = selected?.id === place.id;
          return (
            <button
              key={place.id}
              type="button"
              aria-label={place.name}
              // A tap selects the pin; the guard keeps a map drag from selecting.
              onPointerUp={(event) => {
                event.stopPropagation();
                if (!moved.current) setSelected(place);
              }}
              // Keyboard activation (Enter/Space) arrives as a click with detail 0.
              onClick={(event) => {
                if (event.detail === 0) setSelected(place);
              }}
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: pos.x, top: pos.y }}
            >
              <span
                className={cn(
                  'block rounded-full border-2 border-white shadow-md',
                  active ? 'size-4' : 'size-3.5',
                  place.kind === 'police' ? 'bg-ios-blue' : 'bg-ios-red',
                )}
              />
              <span className="mt-0.5 whitespace-nowrap rounded bg-white/85 px-1 text-[10px] font-semibold text-[#1c1c1e] shadow-sm">
                {place.name}
              </span>
            </button>
          );
        })}

        {/* status chip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SNAPPY}
          className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md"
        >
          <span>{clock}</span>
          <span className="opacity-50">·</span>
          <span>{isNightHour(hour) ? '야간' : '주간'}</span>
          <span className="opacity-50">·</span>
          <span>{heatLabel(heatTier(heat))}</span>
        </motion.div>

        {/* zoom + recenter */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING_SNAPPY}
          className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl bg-ios-surface/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => zoomBy(1)}
            aria-label="확대"
            className="flex size-10 items-center justify-center active:bg-ios-separator/20"
          >
            <Plus className="size-5" aria-hidden />
          </button>
          <span className="h-px bg-ios-separator/30" />
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            aria-label="축소"
            className="flex size-10 items-center justify-center active:bg-ios-separator/20"
          >
            <Minus className="size-5" aria-hidden />
          </button>
          <span className="h-px bg-ios-separator/30" />
          <button
            type="button"
            onClick={() => setView({ zoom: 14, ...CITY_CENTER })}
            aria-label="중심으로"
            className="flex size-10 items-center justify-center active:bg-ios-separator/20"
          >
            <Crosshair className="size-5" aria-hidden />
          </button>
        </motion.div>

        {/* legend */}
        <AnimatePresence>
          {overlay ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={SPRING_SNAPPY}
              className="pointer-events-none absolute bottom-3 left-3 z-20 flex gap-3 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white backdrop-blur-md"
            >
              {(['low', 'mid', 'high'] as PatrolLevel[]).map((level) => (
                <span key={level} className="flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
                  {patrolLabel(level)}
                </span>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* OSM attribution (required) */}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1 right-2 z-20 rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-[#333]"
        >
          © OpenStreetMap
        </a>

        {/* place sheet */}
        <AnimatePresence>
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '110%' }}
              transition={SPRING_SNAPPY}
              className="glass-strong absolute inset-x-3 bottom-3 z-30 rounded-3xl p-4 shadow-2xl ring-1 ring-black/5"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-ios-muted">{KIND_LABEL[selected.kind]}</p>
                  <h3 className="truncate text-[18px] font-bold">{selected.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="닫기"
                  className="flex size-8 items-center justify-center rounded-full bg-ios-separator/25"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: LEVEL_COLOR[levels[selected.id]] }}
                />
                <span className="text-[14px] font-semibold">
                  지금 {patrolLabel(levels[selected.id])}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ios-muted">{selected.note}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
