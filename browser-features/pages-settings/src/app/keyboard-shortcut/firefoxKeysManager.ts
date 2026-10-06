/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useEffect, useState } from "react";
import type { FirefoxKeyEntry } from "../../../../modules/common/NRKeySyncTypes.ts";
import { keySync } from "../../lib/rpc/keysync.ts";

export interface FirefoxKeysState {
  keys: FirefoxKeyEntry[];
  writeEnabled: boolean;
  loading: boolean;
}

/**
 * Loads the Firefox live key mirror once and keeps it up to date via
 * keySync.subscribe. Failures degrade to an empty list so conflict
 * detection stays silent instead of breaking the editor.
 */
export const useFirefoxKeys = (): FirefoxKeysState => {
  const [keys, setKeys] = useState<FirefoxKeyEntry[]>([]);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [entries, canWrite] = await Promise.all([
          keySync.getKeys(),
          keySync.isWriteEnabled(),
        ]);
        if (cancelled) return;
        setKeys(entries);
        setWriteEnabled(canWrite);
      } catch (error) {
        console.error(
          "[KeyboardShortcut] Failed to load Firefox keys",
          error,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const unsubscribe = keySync.subscribe((nextKeys) => {
      setKeys(nextKeys);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { keys, writeEnabled, loading };
};
