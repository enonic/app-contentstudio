import { Checkbox, useCombobox } from '@enonic/ui';
import { type ReactElement } from 'react';
import { PrincipalLabel } from '../../../../shared/ui/PrincipalLabel';
import type { PrincipalOption } from './principal.types';

export type PrincipalLabelOptionProps = {
    option: PrincipalOption;
    showCheckbox?: boolean;
};

const PRINCIPAL_LABEL_OPTION_NAME = 'PrincipalLabelOption';

// Renders as a fragment so PrincipalLabel and the checkbox stay direct children of Listbox.Item.
export const PrincipalLabelOption = ({
    option,
    showCheckbox = true,
}: PrincipalLabelOptionProps): ReactElement | null => {
    const { selection } = useCombobox();

    if (!option.principal) {
        return null;
    }

    return (
        <>
            <PrincipalLabel principal={option.principal} className="flex-1" />
            {showCheckbox && (
                <Checkbox
                    tabIndex={-1}
                    checked={selection.has(option.id)}
                    onClick={(event) => event.preventDefault()}
                />
            )}
        </>
    );
};

PrincipalLabelOption.displayName = PRINCIPAL_LABEL_OPTION_NAME;
