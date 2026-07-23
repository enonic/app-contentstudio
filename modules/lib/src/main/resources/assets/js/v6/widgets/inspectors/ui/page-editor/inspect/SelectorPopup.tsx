import { Combobox, Listbox } from '@enonic/ui';
import type { ReactElement, ReactNode } from 'react';

const SELECTOR_POPUP_NAME = 'SelectorPopup';

type SelectorOption = {
    key: string;
};

type SelectorPopupProps<T extends SelectorOption> = {
    options: T[];
    emptyLabel: string;
    children: (option: T) => ReactNode;
};

export const SelectorPopup = <T extends SelectorOption>({
    options,
    emptyLabel,
    children,
}: SelectorPopupProps<T>): ReactElement => (
    <Combobox.Portal>
        <Combobox.Popup>
            {options.length === 0 ? (
                <div className="p-4 text-subtle">{emptyLabel}</div>
            ) : (
                 <Listbox.Content className="max-h-60 rounded-sm">
                     {options.map((option) => (
                         <Listbox.Item key={option.key} value={option.key}>
                             {children(option)}
                         </Listbox.Item>
                     ))}
                 </Listbox.Content>
             )}
        </Combobox.Popup>
    </Combobox.Portal>
);

SelectorPopup.displayName = SELECTOR_POPUP_NAME;
