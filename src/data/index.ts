import type { Clue, MarketSite, NpcProfile } from '@/types';
import cluesRaw from './clues.json';
import marketsRaw from './markets.json';
import npcsRaw from './npcs.json';

/**
 * Static content lives in JSON so writers can edit it without touching code.
 * The shapes are asserted here against the shared types.
 */
export const markets = marketsRaw as MarketSite[];
export const npcs = npcsRaw as NpcProfile[];
export const clues = cluesRaw as Clue[];
