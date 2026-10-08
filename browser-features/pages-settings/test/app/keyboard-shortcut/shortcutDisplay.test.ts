// SPDX-License-Identifier: MPL-2.0
// @colocated-env browser

import enUS from "../../../src/lib/i18n/locales/en-US.json" with {
  type: "json",
};
import jaJP from "../../../src/lib/i18n/locales/ja-JP.json" with {
  type: "json",
};
import {
  assert,
  assertEquals,
  runTests,
  type TestCase,
} from "../../../../chrome/test/utils/test_harness.ts";
import type { FirefoxKeyEntry } from "../../../../modules/common/NRKeySyncTypes.ts";
import type { ShortcutConfig } from "../../../src/types/pref.ts";
import {
  filterActionsForFirefoxPriority,
  getFloorpCanonicalCode,
  groupActionsByCategory,
} from "../../../src/app/keyboard-shortcut/shortcutDisplay.ts";

function createShortcut(
  key: string,
  modifiers: Partial<ShortcutConfig["modifiers"]> = {},
): ShortcutConfig {
  return {
    key,
    modifiers: {
      alt: false,
      ctrl: true,
      meta: false,
      shift: false,
      ...modifiers,
    },
    action: "gecko-back",
  };
}

function createFirefoxKey(
  canonicalCode: string | null,
): FirefoxKeyEntry {
  return {
    id: "key_test",
    keysetKind: "main",
    modifiers: "accel",
    key: "T",
    keycode: "",
    command: "",
    internal: false,
    reserved: false,
    customized: false,
    label: "Test",
    shortcutText: "Ctrl+T",
    canonicalCode,
  };
}

function testFloorpCanonicalCodeNormalizesSimpleKeys(): void {
  assertEquals(
    getFloorpCanonicalCode(createShortcut("T")),
    "ctrl+KeyT",
    "letters should be normalized into event.code space",
  );
  assertEquals(
    getFloorpCanonicalCode(createShortcut("KeyT")),
    "ctrl+KeyT",
    "already normalized keys should be preserved",
  );
}

function testFirefoxPriorityHidesConfiguredDuplicatesOnly(): void {
  const actions = [
    { id: "gecko-back", name: "Back" },
    { id: "gecko-forward", name: "Forward" },
    { id: "gecko-reload", name: "Reload" },
  ];
  const shortcuts = {
    "gecko-back": createShortcut("KeyT"),
    "gecko-forward": createShortcut("KeyR"),
  };
  const result = filterActionsForFirefoxPriority(actions, shortcuts, [
    createFirefoxKey("ctrl+KeyT"),
  ]);

  assertEquals(
    result.visibleActions.map((action) => action.id),
    ["gecko-forward", "gecko-reload"],
    "only the configured Firefox duplicate should be hidden",
  );
  assertEquals(
    result.hiddenActionCount,
    1,
    "only the configured duplicate should be counted",
  );
}

function testActionsAreGroupedWithoutEmptyCategories(): void {
  const actions = [
    { id: "gecko-open-new-tab", name: "New tab" },
    { id: "gecko-open-new-window", name: "New window" },
    { id: "floorp-toggle-zen-mode", name: "Zen mode" },
  ];
  const categories = groupActionsByCategory(actions);

  assertEquals(
    categories.map((category) => category.id),
    ["tabs", "windows", "floorp"],
    "empty categories should not be rendered",
  );
  assertEquals(
    categories[0].actions[0].id,
    "gecko-open-new-tab",
    "category contents should preserve source order",
  );
}

function testShortcutDisplayLocales(): void {
  const categoryKeys = [
    "tabs",
    "windows",
    "page",
    "bookmarksAndHistory",
    "appearance",
    "scrolling",
    "floorp",
    "tools",
    "other",
  ] as const;

  for (
    const [localeName, locale] of [
      ["en-US", enUS],
      ["ja-JP", jaJP],
    ] as const
  ) {
    for (const key of categoryKeys) {
      assert(
        typeof locale.keyboardShortcut.categories[key] === "string",
        `${localeName} should define category ${key}`,
      );
    }
    assert(
      locale.keyboardShortcut.hiddenByFirefox.includes(
        "{{replacementCount}}",
      ),
      `${localeName} should include the hidden count`,
    );
  }
}

export async function runAllTests(): Promise<void> {
  const tests: TestCase[] = [
    {
      name: "Floorp canonical code normalizes simple keys",
      fn: testFloorpCanonicalCodeNormalizesSimpleKeys,
    },
    {
      name: "Firefox priority hides configured duplicates only",
      fn: testFirefoxPriorityHidesConfiguredDuplicatesOnly,
    },
    {
      name: "actions are grouped without empty categories",
      fn: testActionsAreGroupedWithoutEmptyCategories,
    },
    { name: "shortcut display locales", fn: testShortcutDisplayLocales },
  ];
  await runTests("shortcutDisplay.test.ts", tests);
}
