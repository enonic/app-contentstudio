import { Checkbox, type CheckboxChecked, IconButton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { RefreshCcw } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { reloadProjects } from '../../../entities/project';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { resetSettingsTreeForReload } from '../model/settings-tree.store';
import {
    $isAllSelected,
    $isNoneSelected,
    $selectionCount,
    clearSelection,
    selectAll,
    setActive,
} from '../model/settingsTreeSelection.store';

const SETTINGS_TREE_LIST_TOOLBAR_NAME = 'SettingsTreeListToolbar';

const handleReload = (): void => {
    clearSelection();
    setActive(null);
    resetSettingsTreeForReload();
    reloadProjects();
};

export const SettingsTreeListToolbar = (): ReactElement => {
    const isAllSelected = useStore($isAllSelected);
    const totalSelected = useStore($selectionCount);
    const isNoneSelected = useStore($isNoneSelected);
    const reloadLabel = useI18n('action.reload.projects');
    const selectAllLabel = useI18n('field.selection.selectAll');
    const clearLabel = useI18n('field.selection.clear', totalSelected);
    const checkboxLabel = isNoneSelected ? selectAllLabel : clearLabel;

    const checkedStatus = useMemo<CheckboxChecked>(() => {
        if (isAllSelected) return true;
        if (isNoneSelected) return false;
        return 'indeterminate';
    }, [isAllSelected, isNoneSelected]);

    const handleCheckboxClick = (): void => {
        if (isNoneSelected) {
            selectAll();
        } else {
            clearSelection();
        }
    };

    return (
        <div
            data-component={SETTINGS_TREE_LIST_TOOLBAR_NAME}
            className="bg-surface-neutral flex items-center justify-between px-3.5 sm:px-5 py-2.5 gap-2"
        >
            <div className="ml-2.5 flex items-center gap-2.5">
                <Checkbox
                    aria-label={checkboxLabel}
                    label={checkboxLabel}
                    defaultChecked={false}
                    checked={checkedStatus}
                    onClick={handleCheckboxClick}
                />
            </div>

            <IconButton aria-label={reloadLabel} icon={RefreshCcw} onClick={handleReload} className="max-sm:size-7.5" />
        </div>
    );
};

SettingsTreeListToolbar.displayName = SETTINGS_TREE_LIST_TOOLBAR_NAME;
