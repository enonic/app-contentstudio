import { Checkbox, useCombobox } from '@enonic/ui';
import { type ReactElement } from 'react';
import { PrincipalOptionRow } from './PrincipalOptionRow';
import type { PrincipalOption } from './principal.types';

export type PrincipalOptionItemProps = {
    option: PrincipalOption;
    value: string;
};

const PRINCIPAL_OPTION_ITEM_NAME = 'PrincipalOptionItem';

export const PrincipalOptionItem = ({ option, value }: PrincipalOptionItemProps): ReactElement => {
    const { selection } = useCombobox();
    const isSelected = selection.has(value);

    return (
        <div data-component={PRINCIPAL_OPTION_ITEM_NAME} className="flex w-full items-center gap-x-2.5">
            <PrincipalOptionRow option={option} />
            <Checkbox
                checked={isSelected}
                className="ml-auto"
                tabIndex={-1}
                aria-hidden="true"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => event.preventDefault()}
            />
        </div>
    );
};

PrincipalOptionItem.displayName = PRINCIPAL_OPTION_ITEM_NAME;
