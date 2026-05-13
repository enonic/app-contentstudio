import {createPortal, forwardRef, useCallback, useMemo, useState, type ReactElement} from 'react';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import type {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {Button, Combobox, Listbox} from '@enonic/ui';
import {ItemLabel} from '../../../ItemLabel';
import {useI18n} from '../../../../hooks/useI18n';
import {ConfirmFocusTrap} from './ConfirmFocusTrap';
import {useConfirmKeyboard} from './hooks';

type OptionSetConfirmAddProps = {
    optionSet: FormOptionSet;
    position: {top: number; left: number; width: number} | null;
    onCancel: () => void;
    onConfirm: (selectedName: string) => void;
};

export const OptionSetConfirmAdd = forwardRef<HTMLDivElement, OptionSetConfirmAddProps>(
    ({optionSet, position, onCancel, onConfirm}, ref): ReactElement => {
        const cancelLabel = useI18n('action.cancel');
        const placeholder = useI18n('field.option.placeholder');
        const [value, setValue] = useState('');
        const filteredOptions: FormOptionSetOption[] = useMemo(
            () =>
                optionSet
                    .getOptions()
                    .filter((option) => (option.getLabel() || option.getName()).toLowerCase().includes(value.toLowerCase())),
            [optionSet, value]
        );

        useConfirmKeyboard({onCancel, enabled: true});

        const handleSelectionChange = useCallback(
            (names: readonly string[]) => {
                if (names.length > 0) onConfirm(names[0]);
            },
            [onConfirm]
        );

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
                <div className="flex justify-center">
                    <Button variant="filled" label={cancelLabel} onClick={onCancel} />
                </div>

                <Combobox.Root defaultOpen value={value} onChange={setValue} onSelectionChange={handleSelectionChange}>
                    <Combobox.Content className="w-full">
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
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
