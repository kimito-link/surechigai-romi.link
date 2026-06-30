type IdleCancel = () => void;

/**
 * 初回描画後に実行する（kimito FontLoader / 帯域譲渡と同思想）。
 * requestIdleCallback が無い環境では短い setTimeout にフォールバック。
 */
export function scheduleAfterIdle(
  callback: () => void,
  options?: { fallbackDelayMs?: number; timeoutMs?: number },
): IdleCancel {
  if (typeof window === "undefined") {
    return () => {};
  }

  const fallbackDelayMs = options?.fallbackDelayMs ?? 300;
  const timeoutMs = options?.timeoutMs ?? 2_500;

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, fallbackDelayMs);
  return () => window.clearTimeout(id);
}

/** window load 後（既に complete なら即時）に callback を実行。 */
export function scheduleAfterWindowLoad(callback: () => void): IdleCancel {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (document.readyState === "complete") {
    return scheduleAfterIdle(callback);
  }

  const onLoad = () => {
    window.removeEventListener("load", onLoad);
    scheduleAfterIdle(callback);
  };
  window.addEventListener("load", onLoad, { once: true });
  return () => window.removeEventListener("load", onLoad);
}
