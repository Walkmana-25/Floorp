import styles from "@/components/common/settings-sections.module.css";
import { Button } from "../../../../../../libs/ui/button.tsx";
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ShortcutConfig } from "../../../types/pref.ts";
import type { ShortcutsSettingsProps } from "../types.ts";
import { useAvailableActions } from "../../gesture/useAvailableActions.ts";
import { getKeyboardShortcutActionOptions } from "../actionCatalog.ts";
import {
    filterActionsForFirefoxPriority,
    groupActionsByCategory,
    type ShortcutCategoryId,
} from "../shortcutDisplay.ts";
import { useFirefoxKeys } from "../firefoxKeysManager.ts";
import { ShortcutEditor } from "./ShortcutEditor.tsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/common/card.tsx";
import { Keyboard } from "lucide-react";
import { InfoTip } from "@/components/common/infotip.tsx";
import { formatModifierSymbol } from "../platform.ts";

function formatKeyCode(code: string): string {
    return code.replace(/^(Key|Digit|Arrow)/, "").toUpperCase();
}

export const ShortcutsSettings = ({
    config,
    addShortcut,
    updateShortcut,
    deleteShortcut,
}: ShortcutsSettingsProps) => {
    const { t } = useTranslation();
    const availableActions = useAvailableActions();
    const { keys: firefoxKeys, loading: firefoxKeysLoading } = useFirefoxKeys();
    const actions = getKeyboardShortcutActionOptions(
        (key, fallback) => t(key, fallback),
        availableActions,
    );
    const { visibleActions, hiddenActionCount } = filterActionsForFirefoxPriority(
        actions,
        config.shortcuts ?? {},
        firefoxKeys,
    );
    const categories = groupActionsByCategory(visibleActions);
    const [editingAction, setEditingAction] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<ShortcutConfig | null>(null);

    const handleSaveShortcut = async (shortcut: ShortcutConfig) => {
        if (!editingAction) return false;
        const saved = config.shortcuts[editingAction]
            ? await updateShortcut(editingAction, shortcut)
            : await addShortcut(editingAction, shortcut);
        if (!saved) return false;
        setEditingShortcut(null);
        setEditingAction(null);
        return true;
    };

    type KeyboardActionOption = (typeof actions)[number];

    const renderAction = (action: KeyboardActionOption) => {
        const shortcut = config.shortcuts[action.id];
        return (
            <tr key={action.id}>
                <td>{action.name}</td>
                <td>
                    {shortcut ? (
                        <div className="flex items-center space-x-2">
                            {shortcut.modifiers.alt && <span>{formatModifierSymbol("alt")}</span>}
                            {shortcut.modifiers.ctrl && <span>{formatModifierSymbol("ctrl")}</span>}
                            {shortcut.modifiers.meta && <span>{formatModifierSymbol("meta")}</span>}
                            {shortcut.modifiers.shift && <span>{formatModifierSymbol("shift")}</span>}
                            <span>{formatKeyCode(shortcut.key)}</span>
                        </div>
                    ) : (
                        <span className="text-base-content/50">
                            {t("keyboardShortcut.notSet")}
                        </span>
                    )}
                </td>
                <td>
                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => {
                                setEditingShortcut(shortcut);
                                setEditingAction(action.id);
                                setIsEditorOpen(true);
                            }}
                        >
                            {shortcut ? t("keyboardShortcut.edit") : t("keyboardShortcut.add")}
                        </Button>
                        {shortcut && (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => deleteShortcut(action.id)}
                            >
                                {t("keyboardShortcut.delete")}
                            </Button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const renderCategory = (category: {
        id: ShortcutCategoryId;
        actions: KeyboardActionOption[];
    }) => (
        <tbody key={category.id}>
            <tr>
                <th colSpan={3}>
                    {t(`keyboardShortcut.categories.${category.id}`)}
                </th>
            </tr>
            {category.actions.map(renderAction)}
        </tbody>
    );

    return (
        <Card className={styles.section}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Keyboard className="size-5" />
                    {t("keyboardShortcut.shortcuts")}
                </CardTitle>
                <CardDescription className={styles.description}>
                    <span className="inline-flex items-center gap-2">
                        {t("keyboardShortcut.shortcutsDescription")}
                        <InfoTip
                            description={t("keyboardShortcut.shortcutsTip")}
                        />
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!firefoxKeysLoading && hiddenActionCount > 0 && (
                    <div className="floorp-notice mb-4 text-base-content/70">
                        <span className="text-sm">
                            {t("keyboardShortcut.hiddenByFirefox", {
                                replacementCount: hiddenActionCount,
                            })}
                        </span>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className={`floorp-table ${styles.table}`}>
                        <thead>
                            <tr>
                                <th>{t("keyboardShortcut.action")}</th>
                                <th>{t("keyboardShortcut.shortcut")}</th>
                                <th>{t("keyboardShortcut.actions")}</th>
                            </tr>
                        </thead>
                        {categories.map(renderCategory)}
                    </table>
                </div>

                {isEditorOpen && (
                    <ShortcutEditor
                        isOpen={isEditorOpen}
                        onClose={() => setIsEditorOpen(false)}
                        onSave={handleSaveShortcut}
                        initialShortcut={editingShortcut}
                        existingShortcuts={Object.values(config.shortcuts)}
                        actionId={editingAction || ""}
                    />
                )}
            </CardContent>
        </Card>
    );
};
