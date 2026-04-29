import {useStore} from '@nanostores/preact';
import type {LucideIcon} from 'lucide-react';
import {LayoutTemplate, SquareChartGantt, SquareCode, WandSparkles} from 'lucide-react';
import {useCallback, useMemo, useState} from 'react';
import type {PageTemplate} from '../../../../../../../../../app/content/PageTemplate';
import {useI18n} from '../../../../../../../hooks/useI18n';
import {
    $contentContext,
    $defaultPageTemplateName,
    bumpInsertTabActivateNonce,
    executePageReset,
    requestPageReset,
    requestSetPageController,
    requestSetPageTemplate,
    usePageState,
} from '../../../../../../../store/page-editor';
import {
    $isPageInspectionLoading,
    $pageControllerOptions,
    $pageTemplateOptions,
    $selectedPageOptionKey,
} from '../../../../../../../store/page-inspection.store';

const AUTO_KEY = '__auto__';

type OptionType = 'auto' | 'template' | 'controller';

export type PageOption = {
    key: string;
    label: string;
    description: string;
    type: OptionType;
    icon: LucideIcon;
};

export type ConfirmDialogState = {
    question: string;
    onConfirm: () => void;
};

function getTemplateIcon(template: PageTemplate): LucideIcon {
    return template.getDisplayName() === 'Custom' ? SquareChartGantt : LayoutTemplate;
}

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
    const page = usePageState();
    const ctx = useStore($contentContext);
    const defaultTemplateName = useStore($defaultPageTemplateName);
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);
    const selectedKey = useStore($selectedPageOptionKey);
    const isLoading = useStore($isPageInspectionLoading);

    const autoLabel = useI18n('widget.pagetemplate.automatic');
    const noDefaultLabel = useI18n('field.page.template.noDefault');
    const noDescriptionLabel = useI18n('text.noDescription');
    const templateChangeQuestion = useI18n('dialog.template.change');
    const controllerChangeQuestion = useI18n('dialog.controller.change');

    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

    const isFragment = page?.isFragment() ?? false;
    const showAutoOption = !!ctx && !ctx.isPageTemplate && !isFragment;

    const autoDescription = defaultTemplateName ? `(${defaultTemplateName})` : noDefaultLabel;

    const options = useMemo((): PageOption[] => {
        const result: PageOption[] = [];

        if (showAutoOption) {
            result.push({key: AUTO_KEY, label: autoLabel, description: autoDescription, type: 'auto', icon: WandSparkles});
        }

        for (const t of templates) {
            result.push({
                key: t.getKey().toString(),
                label: t.getDisplayName(),
                description: t.getPath()?.toString() ?? t.getKey().toString(),
                type: 'template',
                icon: getTemplateIcon(t),
            });
        }

        for (const c of controllers) {
            result.push({
                key: c.getKey().toString(),
                label: c.getDisplayName(),
                description: c.getDescription() || noDescriptionLabel,
                type: 'controller',
                icon: SquareCode,
            });
        }

        return result;
    }, [showAutoOption, autoLabel, autoDescription, noDescriptionLabel, templates, controllers]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options;
        const lower = searchValue.toLowerCase();
        return options.filter(o => o.label.toLowerCase().includes(lower));
    }, [searchValue, options]);

    const selectedOption = useMemo(
        () => options.find(o => o.key === selectedKey),
        [options, selectedKey],
    );

    const getOptionType = useCallback(
        (key: string): OptionType | undefined => {
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

    const selection = selectedKey ? [selectedKey] : [];

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
