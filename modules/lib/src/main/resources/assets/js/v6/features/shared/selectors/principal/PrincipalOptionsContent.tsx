import { Listbox, useCombobox } from '@enonic/ui';
import { type ComponentProps, type ReactElement, type ReactNode } from 'react';

export type PrincipalOptionsContentProps = {
    label: string;
    emptyLabel?: string;
    hasOptions: boolean;
    className?: string;
    children: ReactNode;
};

const PRINCIPAL_OPTIONS_CONTENT_NAME = 'PrincipalOptionsContent';

export const PrincipalOptionsContent = ({
    label,
    emptyLabel,
    hasOptions,
    className,
    children,
}: PrincipalOptionsContentProps): ReactElement => {
    const { applyStagedSelection, stagingEnabled } = useCombobox();

    type OnKeyDownCapture = NonNullable<ComponentProps<typeof Listbox.Content>['onKeyDownCapture']>;

    const handleKeyDownCapture: OnKeyDownCapture = (event) => {
        if (!stagingEnabled) {
            return;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            applyStagedSelection();
        }
    };

    const emptyContent = emptyLabel ? <div className="px-4.5 py-2 text-sm text-subtle">{emptyLabel}</div> : null;

    return (
        <Listbox.Content className={className} label={label} onKeyDownCapture={handleKeyDownCapture}>
            {hasOptions ? children : emptyContent}
        </Listbox.Content>
    );
};

PrincipalOptionsContent.displayName = PRINCIPAL_OPTIONS_CONTENT_NAME;
