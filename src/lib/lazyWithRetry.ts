import { lazy, type ComponentType } from "react";

/**
 * 2026-11-11: loads route pages lazily without showing the error page when only the download failed.
 *
 * A page's code is a separate file (chunk). Its download can fail on a slow / dropped connection,
 * or after a deploy: a tab opened before it asks for chunk names the deploy removed. While a chunk
 * loads, the route's <Suspense> fallback (the loading screen) shows. On failure:
 * 1. retry the download in place (RETRY_DELAYS_MS) - fixes a flaky connection without losing state;
 * 2. still failing → reload the page once, which fetches the new build after a deploy. The promise
 *    never resolves meanwhile, so the loading screen stays up until the reload;
 * 3. failing again right after that reload → give up and let the error page show it.
 * Errors that aren't download failures (a bug in the page's code) go straight to the error page.
 *
 * Replaces the wrapper that was inline in routes/index.tsx. Its "already reloaded" flag was meant
 * to be cleared by a 10 s setTimeout, which the reload itself killed, so after one reload every
 * later chunk failure in that browser session went straight to the error page. Here the flag
 * stores a time instead, so it simply expires.
 *
 * Note: some browsers remember a failed module URL and fail the in-place retry the same way; step 2
 * covers that.
 */

const RETRY_DELAYS_MS = [500, 1500];
const RELOAD_KEY = "chunk-reload-at";
/** A second reload within this window means the reload didn't help: show the error instead. */
const RELOAD_GUARD_MS = 60_000;

// Messages browsers / Vite use when a module or its CSS can't be downloaded.
const CHUNK_ERROR_PATTERNS = [
    /Failed to fetch dynamically imported module/i, // Chrome, Edge
    /error loading dynamically imported module/i, // Firefox
    /Importing a module script failed/i, // Safari
    /Unable to preload CSS/i, // Vite CSS preload
    /Loading (CSS )?chunk .* failed/i,
];

export const isChunkLoadError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    return error.name === "ChunkLoadError" || CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reloads the page unless it was already reloaded for this reason within RELOAD_GUARD_MS.
 * Returns false when it won't reload (the caller should then surface the error).
 * sessionStorage can throw (private mode, blocked storage); without it we still reload, since the
 * guard can't be checked either way and a reload is the only fix for a stale build.
 */
export const reloadOnceForNewBuild = (): boolean => {
    try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - last < RELOAD_GUARD_MS) return false;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
        // Storage unavailable: fall through and reload.
    }
    window.location.reload();
    return true;
};

export const lazyWithRetry = <T extends ComponentType<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
    load: () => Promise<{ default: T }>,
) =>
    lazy(async () => {
        let lastError: unknown;
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            try {
                return await load();
            } catch (error) {
                lastError = error;
                if (!isChunkLoadError(error)) throw error; // a real bug: show it
                if (attempt < RETRY_DELAYS_MS.length) await wait(RETRY_DELAYS_MS[attempt]);
            }
        }
        console.error("Page download failed after retries:", lastError);
        if (reloadOnceForNewBuild()) {
            return new Promise<never>(() => {}); // keep the loading screen until the reload
        }
        throw lastError;
    });
