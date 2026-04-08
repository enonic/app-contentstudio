import {Combobox, Listbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {LucideIcon} from 'lucide-react';
import {LayoutTemplate, SquareChartGantt, SquareCode, WandSparkles} from 'lucide-react';
import {type ReactElement, useCallback, useMemo, useState} from 'react';
import type {PageTemplate} from '../../../../../../../../app/content/PageTemplate';
import {useI18n} from '../../../../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../../../../shared/dialogs/ConfirmationDialog';
import {
    $contentContext,
    $defaultPageTemplateName,
    $page,
    executePageReset,
    requestSetPageController,
    requestSetPageTemplate,
} from '../../../../../../store/pageEditor.store';
import {
    $isPageInspectionLoading,
    $pageControllerOptions,
    $pageTemplateOptions,
    $selectedPageOptionKey,
} from '../../../../../../store/pageInspection.store';

const AUTO_KEY = '__auto__';

type OptionType = 'auto' | 'template' | 'controller';

type PageOption = {
    key: string;
    label: string;
    description: string;
    type: OptionType;
    icon: LucideIcon;
};

type ConfirmDialogState = {
    question: string;
    onConfirm: () => void;
};

function getTemplateIcon(template: PageTemplate): LucideIcon {
    return template.getDisplayName() === 'Custom' ? SquareChartGantt : LayoutTemplate;
}

const PAGE_CONTROLLER_SELECTOR_NAME = 'PageControllerSelector';

export const PageControllerSelector = (): ReactElement | null => {
    const page = useStore($page);
    const ctx = useStore($contentContext);
    const defaultTemplateName = useStore($defaultPageTemplateName);
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);
    const selectedKey = useStore($selectedPageOptionKey);
    const isLoading = useStore($isPageInspectionLoading);

    const templateLabel = useI18n('field.page.template');
    const autoLabel = useI18n('widget.pagetemplate.automatic');
    const noDefaultLabel = useI18n('field.page.template.noDefault');
    const noDescriptionLabel = useI18n('text.noDescription');
    const noControllersLabel = useI18n('text.notemplatesorblocks');
    const searchPlaceholder = useI18n('field.option.placeholder');
    const resetQuestion = useI18n('dialog.page.reset.confirmation');
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
                if (template) requestSetPageTemplate(template.getKey());
            } else {
                const controller = controllers.find(c => c.getKey().toString() === newKey);
                if (controller) requestSetPageController(controller.getKey());
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

            // Transitions to auto (reset) need confirmation
            if (newType === 'auto' && oldType && oldType !== 'auto') {
                setConfirmDialog({question: resetQuestion, onConfirm: () => executeSelection(newKey)});
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
        [selectedKey, getOptionType, executeSelection, resetQuestion, templateChangeQuestion, controllerChangeQuestion],
    );

    if (isLoading) return null;

    if (options.length === 0 && !page?.hasController()) {
        return <p className="text-sm text-subtle">{noControllersLabel}</p>;
    }

    const selection = selectedKey ? [selectedKey] : [];

    return (
        <>
            <div className="flex flex-col gap-2.5">
                <span className="font-semibold">{templateLabel}</span>
                <Combobox.Root
                    value={searchValue}
                    onChange={setSearchValue}
                    selection={selection}
                    onSelectionChange={handleSelectionChange}
                >
                    <Combobox.Content>
                        <Combobox.Control>
                            <Combobox.Search>
                                {selectedOption && (
                                    <Combobox.Value className="gap-2 w-full">
                                        <selectedOption.icon className="size-4 shrink-0" />
                                        <span className="leading-5.5 font-semibold truncate">
                                            {selectedOption.label}
                                        </span>
                                    </Combobox.Value>
                                )}
                                <Combobox.Input placeholder={searchPlaceholder} />
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Popup>
                            <Listbox.Content className="max-h-60 rounded-sm">
                                {filteredOptions.map(option => (
                                    <Listbox.Item key={option.key} value={option.key}>
                                        <option.icon className="size-6 shrink-0" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="leading-5.5 font-semibold truncate group-data-[tone=inverse]:text-alt">
                                                {option.label}
                                            </span>
                                            <small className="leading-4.5 text-sm text-subtle truncate group-data-[tone=inverse]:text-alt">
                                                {option.description}
                                            </small>
                                        </div>
                                    </Listbox.Item>
                                ))}
                            </Listbox.Content>
                        </Combobox.Popup>
                    </Combobox.Content>
                </Combobox.Root>
            </div>

            <ConfirmationDialog.Root
                open={confirmDialog != null}
                onOpenChange={(open) => {
                    if (!open) setConfirmDialog(null);
                }}
            >
                {confirmDialog && (
                    <ConfirmationDialog.Portal>
                        <ConfirmationDialog.Overlay />
                        <ConfirmationDialog.Content>
                            <ConfirmationDialog.Body>
                                {confirmDialog.question}
                            </ConfirmationDialog.Body>
                            <ConfirmationDialog.Footer
                                onConfirm={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(null);
                                }}
                                onCancel={() => setConfirmDialog(null)}
                            />
                        </ConfirmationDialog.Content>
                    </ConfirmationDialog.Portal>
                )}
            </ConfirmationDialog.Root>
        </>
    );
};

PageControllerSelector.displayName = PAGE_CONTROLLER_SELECTOR_NAME;
