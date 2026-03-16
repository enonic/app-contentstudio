import {Listbox, useCombobox} from '@enonic/ui';
import {type ComponentProps, type ReactElement, type ReactNode} from 'react';

export type AssigneeOptionsContentProps = {
    label: string;
    emptyLabel?: string;
    hasOptions: boolean;
    children: ReactNode;
    onApply?: () => void;
};

const ASSIGNEE_OPTIONS_CONTENT_NAME = 'AssigneeOptionsContent';

export const AssigneeOptionsContent = ({
                                           label,
                                           emptyLabel,
                                           hasOptions,
                                           children,
                                           onApply,
                                       }: AssigneeOptionsContentProps): ReactElement => {
    const {applyStagedSelection, stagingEnabled} = useCombobox();

    type OnKeyDownCapture = NonNullable<ComponentProps<typeof Listbox.Content>['onKeyDownCapture']>;

    const handleKeyDownCapture: OnKeyDownCapture = (event) => {
        if (!stagingEnabled) {
            return;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            onApply?.();
            applyStagedSelection();
        }
    };

    return (
        <Listbox.Content className='max-h-100' label={label} onKeyDownCapture={handleKeyDownCapture}>
            {hasOptions ? children : emptyLabel ? (
                <div className='px-4.5 py-2 text-sm text-subtle'>{emptyLabel}</div>
            ) : null}
        </Listbox.Content>
    );
};

AssigneeOptionsContent.displayName = ASSIGNEE_OPTIONS_CONTENT_NAME;
