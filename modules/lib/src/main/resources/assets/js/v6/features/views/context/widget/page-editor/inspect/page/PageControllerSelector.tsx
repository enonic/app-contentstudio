import { Combobox, Listbox } from '@enonic/ui';
import type { ReactElement } from 'react';
import { useI18n } from '../../../../../../hooks/useI18n';
import { ConfirmationDialog } from '../../../../../../shared/dialogs/ConfirmationDialog';
import { usePageControllerSelector } from './hooks/usePageControllerSelector';

const PAGE_CONTROLLER_SELECTOR_NAME = 'PageControllerSelector';

export const PageControllerSelector = (): ReactElement | null => {
    const {
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        confirmDialog,
        setConfirmDialog,
        isLoading,
    } = usePageControllerSelector();

    const templateLabel = useI18n('field.page.template');
    const searchPlaceholder = useI18n('field.option.placeholder');

    if (isLoading) return null;

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
