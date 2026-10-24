import { z } from 'zod';

export const SAVE_VERSION = 1;

export const SaveDataSchema = z.object({
  version: z.number().int().nonnegative(),
  savedAt: z.string(),
  /** Snapshot of the game store (shape owned by the game layer). */
  game: z.unknown(),
  /** Snapshot of the OS store (theme, layout, ...). */
  os: z.unknown(),
});

export type SaveData = z.infer<typeof SaveDataSchema>;

/**
 * Storage-agnostic save contract. The local implementation ships today; a
 * Supabase implementation (anonymous auth + a `saves` table) can be dropped in
 * later without touching any callers.
 */
export interface SaveService {
  readonly kind: 'local' | 'cloud';
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = 'phone-os:save';

function parse(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const result = SaveDataSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Default implementation: a single JSON blob in localStorage. */
export class LocalSaveService implements SaveService {
  readonly kind = 'local' as const;

  async load(): Promise<SaveData | null> {
    return parse(localStorage.getItem(STORAGE_KEY));
  }

  async save(data: SaveData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Placeholder for the future cloud save. It currently mirrors the local
 * service so switch-over can happen behind the same interface. The real
 * implementation will require an anonymous Supabase session.
 */
export class CloudSaveService implements SaveService {
  readonly kind = 'cloud' as const;

  constructor(private readonly fallback: SaveService) {}

  load(): Promise<SaveData | null> {
    return this.fallback.load();
  }

  save(data: SaveData): Promise<void> {
    return this.fallback.save(data);
  }

  clear(): Promise<void> {
    return this.fallback.clear();
  }
}

export const localSaveService = new LocalSaveService();

/** The service the UI talks to. Swap the export to go cloud later. */
export const saveService: SaveService = localSaveService;
