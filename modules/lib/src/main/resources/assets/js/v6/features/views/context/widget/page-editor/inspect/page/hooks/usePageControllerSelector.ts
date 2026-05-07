import {useStore} from '@nanostores/preact';
import {useCallback, useState} from 'react';
import {useI18n} from '../../../../../../../hooks/useI18n';
import {
    type PageOption,
    type PageOptionType,
    usePageOptions,
} from '../../../../../../../hooks/usePageOptions';
import {
    bumpInsertTabActivateNonce,
    executePageReset,
    requestPageReset,
    requestSetPageController,
    requestSetPageTemplate,
} from '../../../../../../../store/page-editor';
import {
    $pageControllerOptions,
    $pageTemplateOptions,
} from '../../../../../../../store/page-inspection.store';

export type ConfirmDialogState = {
    question: string;
    onConfirm: () => void;
};

type UsePageControllerSelectorResult = {
    options: PageOption[];
    filteredOptions: PageOption[];
    selectedOption: PageOption | undefined;
    searchValue: string | undefined;
    setSearchValue: (value: string | undefined) => void;
    selection: string[];
    handleSelectionChange: (selection: readonly string[]) => void;
    confirmDialog: ConfirmDialogState | null;
    setConfirmDialog: (state: ConfirmDialogState | null) => void;
    isLoading: boolean;
};

export function usePageControllerSelector(): UsePageControllerSelectorResult {
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);

    const templateChangeQuestion = useI18n('dialog.template.change');
    const controllerChangeQuestion = useI18n('dialog.controller.change');

    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
    const {
        options,
        filteredOptions,
        selectedOption,
        selectedKey,
        selection,
        isLoading,
    } = usePageOptions(searchValue);

    const getOptionType = useCallback(
        (key: string): PageOptionType | undefined => {
            return options.find(o => o.key === key)?.type;
        },
        [options],
    );

    const executeSelection = useCallback(
        (newKey: string): void => {
            const newType = getOptionType(newKey);
            if (!newType) return;

            if (newType === 'auto') {
                executePageReset();
            } else if (newType === 'template') {
                const template = templates.find(t => t.getKey().toString() === newKey);
                if (template) {
                    requestSetPageTemplate(template.getKey());
                    bumpInsertTabActivateNonce();
                }
            } else {
                const controller = controllers.find(c => c.getKey().toString() === newKey);
                if (controller) {
                    requestSetPageController(controller.getKey());
                    bumpInsertTabActivateNonce();
                }
            }
        },
        [getOptionType, templates, controllers],
    );

    const handleSelectionChange = useCallback(
        (selection: readonly string[]): void => {
            // Prevent deselect
            if (selection.length === 0) return;

            const newKey = selection[0];
            if (newKey === selectedKey) return;

            setSearchValue(undefined);

            const oldType = selectedKey ? getOptionType(selectedKey) : undefined;
            const newType = getOptionType(newKey);

            // Transitions to auto (reset) — delegated to the global PageResetDialog,
            // which owns confirmation and calls executePageReset() on confirm.
            if (newType === 'auto' && oldType && oldType !== 'auto') {
                requestPageReset();
                return;
            }

            // Cross-type transitions (template↔controller) need confirmation
            const needsConfirmation =
                oldType && newType &&
                oldType !== 'auto' && newType !== 'auto' &&
                oldType !== newType;

            if (needsConfirmation) {
                const question = newType === 'template' ? templateChangeQuestion : controllerChangeQuestion;
                setConfirmDialog({question, onConfirm: () => executeSelection(newKey)});
            } else {
                executeSelection(newKey);
            }
        },
        [selectedKey, getOptionType, executeSelection, templateChangeQuestion, controllerChangeQuestion],
    );

    return {
        options,
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        confirmDialog,
        setConfirmDialog,
        isLoading,
    };
}
