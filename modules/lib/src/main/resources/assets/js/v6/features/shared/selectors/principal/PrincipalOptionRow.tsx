import { Avatar } from '@enonic/ui';
import { type ReactElement } from 'react';
import { getInitials } from '../../../../shared/lib/format/initials';
import type { PrincipalOption } from './principal.types';

export type PrincipalOptionRowProps = {
    option: PrincipalOption;
};

const PRINCIPAL_OPTION_ROW_NAME = 'PrincipalOptionRow';

export const PrincipalOptionRow = ({ option }: PrincipalOptionRowProps): ReactElement => {
    return (
        <>
            <Avatar size="md" className="mr-2.5">
                <Avatar.Fallback>{getInitials(option.label)}</Avatar.Fallback>
            </Avatar>
            <div className="flex w-full flex-col gap-0.5">
                <span className="text-md font-medium group-data-[tone=inverse]:text-alt">{option.label}</span>
                {option.description && (
                    <span className="text-sm text-subtle group-data-[tone=inverse]:text-alt">{option.description}</span>
                )}
            </div>
        </>
    );
};

PrincipalOptionRow.displayName = PRINCIPAL_OPTION_ROW_NAME;
