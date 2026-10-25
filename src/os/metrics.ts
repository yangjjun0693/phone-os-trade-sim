/**
 * Layout metrics for the phone OS chrome.
 *
 * The metric values below are approximations measured from iOS screenshots
 * (see ATTRIBUTIONS.md). No Apple assets or trademarks are used.
 */

export const APP_ICON_SIZE = 60;
/** 22.37% — the widely used CSS approximation of the iOS squircle. */
export const ICON_RADIUS_RATIO = 0.2237;

/** Shared layout id linking a home-screen icon to its full-screen window. */
export const appTileId = (appId: string) => `app-tile-${appId}`;

export const ISLAND_COLLAPSED = { width: 126, height: 37 };
