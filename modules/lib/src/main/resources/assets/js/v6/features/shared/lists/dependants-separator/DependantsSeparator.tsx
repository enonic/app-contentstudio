import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { SplitList } from '../split-list';

const DEPENDANTS_SEPARATOR_NAME = 'DependantsSeparator';

export type DependantsSeparatorProps = {
    label: string;
    /** Something is applied-excluded, so the "Show/Hide excluded" toggle is offered. */
    hasExcluded: boolean;
    showExcluded: boolean;
    onToggleExcluded: () => void;
    hidden?: boolean;
    disabled?: boolean;
};

/** DEPENDENCIES header with the "Show/Hide excluded" toggle, shared by the four publish dialogs. */
export const DependantsSeparator = ({
    label,
    hasExcluded,
    showExcluded,
    onToggleExcluded,
    hidden = false,
    disabled = false,
}: DependantsSeparatorProps): ReactElement => {
    const showExcludedLabel = useI18n('dialog.publish.excluded.show');
    const hideExcludedLabel = useI18n('dialog.publish.excluded.hide');
    const toggleExcludedLabel = showExcluded ? hideExcludedLabel : showExcludedLabel;

    return (
        <SplitList.Separator hidden={hidden}>
            <SplitList.SeparatorLabel>{label}</SplitList.SeparatorLabel>
            {hasExcluded && (
                <SplitList.SeparatorButton label={toggleExcludedLabel} onClick={onToggleExcluded} disabled={disabled} />
            )}
        </SplitList.Separator>
    );
};

DependantsSeparator.displayName = DEPENDANTS_SEPARATOR_NAME;
