import {createPortal, forwardRef, useCallback, useMemo, useState, type ReactElement} from 'react';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {Button, Combobox, Listbox} from '@enonic/ui';
import {ItemLabel} from '../../../ItemLabel';
import {useI18n} from '../../../../hooks/useI18n';
import {ConfirmFocusTrap} from './ConfirmFocusTrap';
import {useConfirmKeyboard} from './useConfirmKeyboard';

type OptionSetConfirmAddProps = {
    optionSet: FormOptionSet;
    position: {top: number; left: number; width: number} | null;
    onCancel: () => void;
    onConfirm: (selectedName: string) => void;
};

export const OptionSetConfirmAdd = forwardRef<HTMLDivElement, OptionSetConfirmAddProps>(
    ({optionSet, position, onCancel, onConfirm}, ref): ReactElement | null => {
        const cancelLabel = useI18n('action.cancel');
        const insertLabel = useI18n('action.insert');
        const placeholder = useI18n('field.search.placeholder');
        const [value, setValue] = useState('');
        const [selection, setSelection] = useState<readonly string[]>([]);
        const selectedOption = useMemo(
            () => optionSet.getOptions().find((option) => option.getName() === selection[0]),
            [optionSet, selection]
        );
        const filteredOptions: FormOptionSetOption[] = useMemo(
            () =>
                optionSet
                    .getOptions()
                    .filter((option) => (option.getLabel() || option.getName()).toLowerCase().includes(value.toLowerCase())),
            [optionSet, value]
        );

        useConfirmKeyboard({onCancel, enabled: true});

        const handleConfirm = useCallback(() => {
            if (selection.length === 0) return;
            onConfirm(selection[0]);
        }, [selection, onConfirm]);

        return createPortal(
            <ConfirmFocusTrap
                ref={ref}
                className="fixed z-40 flex flex-col gap-5"
                style={{
                    top: position?.top ?? 0,
                    left: position?.left ?? 0,
                    width: position?.width,
                    visibility: position ? 'visible' : 'hidden',
                }}
            >
                <div className="flex gap-2 justify-center">
                    <Button variant="filled" label={cancelLabel} onClick={onCancel} />
                    <Button variant="solid" label={insertLabel} onClick={handleConfirm} />
                </div>

                <Combobox.Root defaultOpen value={value} onChange={setValue} selection={selection} onSelectionChange={setSelection}>
                    <Combobox.Content className="w-full">
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                {selectedOption && (
                                    <Combobox.Value>
                                        <ItemLabel
                                            icon={null}
                                            primary={selectedOption.getLabel() || selectedOption.getName()}
                                            secondary={selectedOption.getHelpText()}
                                        />
                                    </Combobox.Value>
                                )}
                                <Combobox.Input placeholder={placeholder} />
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Portal>
                            <Combobox.Popup>
                                <Listbox.Content className="rounded-sm">
                                    {filteredOptions.map((option) => (
                                        <Listbox.Item key={option.getName()} value={option.getName()}>
                                            <ItemLabel
                                                icon={null}
                                                primary={option.getLabel() || option.getName()}
                                                secondary={option.getHelpText()}
                                            />
                                        </Listbox.Item>
                                    ))}
                                </Listbox.Content>
                            </Combobox.Popup>
                        </Combobox.Portal>
                    </Combobox.Content>
                </Combobox.Root>
            </ConfirmFocusTrap>,
            document.body
        );
    }
);

OptionSetConfirmAdd.displayName = 'OptionSetConfirmAdd';
