import type {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {useCallback, type ReactElement} from 'react';
import {InlineButton} from '../../../InlineButton';
import {useI18n} from '../../../../hooks/useI18n';

type SetHeaderProps = {
    label: string;
    occurrences: Occurrences;
    isAllExpanded: boolean;
    showToggle: boolean;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    description?: string;
    occurrenceError?: string;
};

const SET_HEADER_NAME = 'SetHeader';

export const SetHeader = ({
    label,
    description,
    isAllExpanded,
    showToggle,
    onExpandAll,
    onCollapseAll,
    occurrences,
    occurrenceError,
}: SetHeaderProps): ReactElement => {
    const isRequired = occurrences.getMinimum() > 0;
    const expandAllLabel = useI18n('button.expandall');
    const collapseAllLabel = useI18n('button.collapseall');

    const toggleLabel = isAllExpanded ? collapseAllLabel : expandAllLabel;

    const handleToggle = useCallback(() => {
        if (isAllExpanded) {
            onCollapseAll();
        } else {
            onExpandAll();
        }
    }, [isAllExpanded, onCollapseAll, onExpandAll]);

    return (
        <div className="flex flex-col gap-1" data-component={SET_HEADER_NAME}>
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-semibold">{label}</span>
                    {isRequired && <span className="text-destructive text-sm">*</span>}
                </div>
                {showToggle && <InlineButton onClick={handleToggle}>{toggleLabel}</InlineButton>}
            </div>
            {description && <span className="text-sm text-subtle">{description}</span>}
            {occurrenceError && <FieldError message={occurrenceError} />}
        </div>
    );
};

SetHeader.displayName = SET_HEADER_NAME;
