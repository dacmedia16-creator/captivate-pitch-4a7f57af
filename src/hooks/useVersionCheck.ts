import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_KEY = "app_version_reloaded";

function getCurrentScriptHash(): string | null {
  const script = document.querySelector('script[type="module"][src]');
  return script?.getAttribute("src") || null;
}

async function fetchRemoteScriptHash(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_cb=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const currentHash = useRef<string | null>(null);

  const checkVersion = useCallback(async () => {
    if (!currentHash.current) return;
    const remoteHash = await fetchRemoteScriptHash();
    if (remoteHash && remoteHash !== currentHash.current) {
      setUpdateAvailable(true);
    }
  }, []);

  useEffect(() => {
    // Anti-loop: if we just reloaded, clear flag and skip
    if (sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    currentHash.current = getCurrentScriptHash();

    // Visibility change
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Periodic poll
    const interval = setInterval(checkVersion, POLL_INTERVAL);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [checkVersion]);

  const doUpdate = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    updateAvailable: updateAvailable && !dismissed,
    doUpdate,
    dismiss,
  };
}
