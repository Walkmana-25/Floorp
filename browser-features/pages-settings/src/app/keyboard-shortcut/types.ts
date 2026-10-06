import type { FirefoxKeyEntry } from "../../../../modules/common/NRKeySyncTypes.ts";
import type { KeyboardShortcutConfig, ShortcutConfig } from "../../types/pref.ts";

export interface ShortcutsSettingsProps {
  config: KeyboardShortcutConfig;
  addShortcut: (action: string, shortcut: ShortcutConfig) => Promise<boolean>;
  updateShortcut: (action: string, shortcut: ShortcutConfig) => Promise<boolean>;
  deleteShortcut: (action: string) => Promise<boolean>;
}

export interface ShortcutEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shortcut: ShortcutConfig) => Promise<boolean>;
  initialShortcut: ShortcutConfig | null;
  existingShortcuts: ShortcutConfig[];
  actionId: string;
}

export interface FirefoxKeyEditorProps {
  entry: FirefoxKeyEntry;
  onClose: () => void;
}
