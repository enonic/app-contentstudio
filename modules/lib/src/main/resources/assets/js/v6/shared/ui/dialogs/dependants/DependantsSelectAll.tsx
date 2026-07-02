import { Checkbox, type CheckboxChecked } from '@enonic/ui';
import { type ReactElement } from 'react';
import { useI18n } from '../../../lib/hooks/useI18n';
import { type DependantsSelection, type DependantsSelectionType } from '../../../lib/cms/content/dependantsSelection';

const DEPENDANTS_SELECT_ALL_NAME = 'DependantsSelectAll';

const CHECKED_BY_TYPE = {
    all: true,
    none: false,
    partial: 'indeterminate',
} as const satisfies Record<DependantsSelectionType, CheckboxChecked>;

export type DependantsSelectAllProps = {
    selection: DependantsSelection;
    onToggle: () => void;
    disabled?: boolean;
};

export const DependantsSelectAll = ({ selection, onToggle, disabled }: DependantsSelectAllProps): ReactElement => {
    const label = useI18n('dialog.select.all', selection.count);

    return (
        <Checkbox
            data-component={DEPENDANTS_SELECT_ALL_NAME}
            className="py-2 ps-2.5 font-semibold"
            label={label}
            checked={CHECKED_BY_TYPE[selection.selectionType]}
            onCheckedChange={onToggle}
            disabled={selection.disabled || disabled}
        />
    );
};

DependantsSelectAll.displayName = DEPENDANTS_SELECT_ALL_NAME;
