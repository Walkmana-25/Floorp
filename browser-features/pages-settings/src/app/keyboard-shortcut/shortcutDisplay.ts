/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { comboToCanonicalCode } from "../../../../modules/common/NRKeySyncCombo.ts";
import type { FirefoxKeyEntry } from "../../../../modules/common/NRKeySyncTypes.ts";
import type { ShortcutConfig } from "../../types/pref.ts";

/** Categories used only by the keyboard shortcut settings page. */
export type ShortcutCategoryId =
  | "tabs"
  | "windows"
  | "page"
  | "bookmarksAndHistory"
  | "appearance"
  | "scrolling"
  | "floorp"
  | "tools"
  | "other";

const SHORTCUT_CATEGORY_ORDER = [
  "tabs",
  "windows",
  "page",
  "bookmarksAndHistory",
  "appearance",
  "scrolling",
  "floorp",
  "tools",
  "other",
] as const satisfies readonly ShortcutCategoryId[];

const CATEGORY_ACTION_IDS: Readonly<
  Record<Exclude<ShortcutCategoryId, "other">, ReadonlySet<string>>
> = {
  tabs: new Set([
    "gecko-close-tab",
    "gecko-close-other-tabs",
    "gecko-close-tabs-to-start",
    "gecko-close-tabs-to-end",
    "gecko-open-new-tab",
    "gecko-duplicate-tab",
    "gecko-reload-all-tabs",
    "gecko-restore-last-tab",
    "gecko-show-next-tab",
    "gecko-show-previous-tab",
    "gecko-show-previously-selected-tab",
    "gecko-show-all-tabs-panel",
    "gecko-mute-current-tab",
  ]),
  windows: new Set([
    "gecko-open-new-window",
    "gecko-open-new-private-window",
    "gecko-close-window",
    "gecko-restore-last-window",
    "gecko-quit-from-application",
  ]),
  page: new Set([
    "gecko-back",
    "gecko-forward",
    "gecko-reload",
    "gecko-force-reload",
    "gecko-stop",
    "gecko-open-home-page",
    "gecko-zoom-in",
    "gecko-zoom-out",
    "gecko-reset-zoom",
    "gecko-search-in-this-page",
    "gecko-show-next-search-result",
    "gecko-show-previous-search-result",
    "gecko-search-the-web",
    "gecko-send-with-mail",
    "gecko-save-page",
    "gecko-print-page",
    "gecko-show-source-of-page",
    "gecko-show-page-info",
    "gecko-open-screen-capture",
  ]),
  bookmarksAndHistory: new Set([
    "gecko-bookmark-this-page",
    "gecko-open-bookmark-add-tool",
    "gecko-open-bookmarks-manager",
    "gecko-toggle-bookmark-toolbar",
    "gecko-forget-history",
    "gecko-quick-forget-history",
    "gecko-restore-last-session",
    "gecko-search-history",
    "gecko-manage-history",
    "gecko-open-downloads",
    "gecko-show-bookmark-sidebar",
    "gecko-show-history-sidebar",
    "gecko-show-synced-tabs-sidebar",
  ]),
  appearance: new Set([
    "gecko-enter-into-customize-mode",
    "gecko-reverse-sidebar",
    "gecko-hide-sidebar",
    "gecko-toggle-sidebar",
  ]),
  scrolling: new Set([
    "gecko-scroll-line-up",
    "gecko-scroll-line-down",
    "gecko-scroll-up",
    "gecko-scroll-down",
    "gecko-scroll-right",
    "gecko-scroll-left",
    "gecko-scroll-to-top",
    "gecko-scroll-to-bottom",
  ]),
  floorp: new Set([
    "floorp-edit-tab-url",
    "floorp-rest-mode",
    "floorp-hide-user-interface",
    "floorp-toggle-navigation-panel",
    "floorp-show-pip",
    "gecko-workspace-next",
    "gecko-workspace-previous",
    "floorp-toggle-zen-mode",
    "floorp-toggle-command-palette",
    "floorp-open-settings",
    "floorp-open-hub",
    "floorp-toggle-share-mode",
    "floorp-copy-page-url-as-markdown",
    "floorp-split-view-open-left",
    "floorp-split-view-open-right",
    "floorp-split-view-open-top",
    "floorp-split-view-open-bottom",
    "floorp-split-view-close",
    "floorp-split-view-swap-panes",
    "floorp-split-view-cycle-layout",
    "floorp-split-view-add-pane",
    "floorp-split-view-remove-pane",
  ]),
  tools: new Set([
    "gecko-open-addons-manager",
    "gecko-open-migration-wizard",
    "gecko-enter-into-offline-mode",
    "gecko-open-general-preferences",
    "gecko-open-privacy-preferences",
    "gecko-open-workspaces-preferences",
    "gecko-open-containers-preferences",
    "gecko-open-search-preferences",
    "gecko-open-sync-preferences",
    "gecko-open-task-manager",
  ]),
};

/** Normalize a Floorp shortcut key into the canonical combo space. */
export function getFloorpCanonicalCode(shortcut: ShortcutConfig): string {
  let key = shortcut.key;
  if (/^[A-Z]$/.test(key)) {
    key = `Key${key}`;
  } else if (/^[0-9]$/.test(key)) {
    key = `Digit${key}`;
  }

  return comboToCanonicalCode(shortcut.modifiers, key);
}

/**
 * Split actions into visible rows and actions whose configured Floorp combo
 * is owned by Firefox in the UI. Actions without a configured combo stay
 * visible because there is nothing to duplicate yet.
 */
export function filterActionsForFirefoxPriority<
  TAction extends { id: string },
>(
  actions: readonly TAction[],
  shortcuts: Record<string, ShortcutConfig>,
  firefoxKeys: readonly FirefoxKeyEntry[],
): {
  visibleActions: TAction[];
  hiddenActionCount: number;
} {
  const firefoxCodes = new Set(
    firefoxKeys.flatMap((entry) =>
      entry.canonicalCode === null ? [] : [entry.canonicalCode]
    ),
  );
  const visibleActions = actions.filter((action) => {
    const shortcut = shortcuts[action.id];
    return !shortcut || !firefoxCodes.has(getFloorpCanonicalCode(shortcut));
  });

  return {
    visibleActions,
    hiddenActionCount: actions.length - visibleActions.length,
  };
}

export interface ShortcutCategory<TAction> {
  id: ShortcutCategoryId;
  actions: TAction[];
}

/** Group actions by stable category while preserving each source order. */
export function groupActionsByCategory<TAction extends { id: string }>(
  actions: readonly TAction[],
): Array<ShortcutCategory<TAction>> {
  const grouped = new Map<ShortcutCategoryId, TAction[]>(
    SHORTCUT_CATEGORY_ORDER.map((id) => [id, []]),
  );

  for (const action of actions) {
    const category = (Object.entries(CATEGORY_ACTION_IDS) as Array<
      [Exclude<ShortcutCategoryId, "other">, ReadonlySet<string>]
    >).find(([, ids]) => ids.has(action.id))?.[0] ?? "other";
    grouped.get(category)?.push(action);
  }

  return SHORTCUT_CATEGORY_ORDER.flatMap((id) => {
    const categoryActions = grouped.get(id) ?? [];
    return categoryActions.length === 0
      ? []
      : [{ id, actions: categoryActions }];
  });
}
