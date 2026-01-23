import {Avatar} from '@enonic/ui';
import {type ReactElement} from 'react';
import {getInitials} from '../../../utils/format/initials';
import type {AssigneeSelectorOption} from './assignee.types';

export type AssigneeOptionRowProps = {
    option: AssigneeSelectorOption;
};

const ASSIGNEE_OPTION_ROW_NAME = 'AssigneeOptionRow';

export const AssigneeOptionRow = ({option}: AssigneeOptionRowProps): ReactElement => {
    return (
        <>
            <Avatar size='md' className='mr-2.5'>
                <Avatar.Fallback>{getInitials(option.label)}</Avatar.Fallback>
            </Avatar>
            <div className='flex w-full flex-col gap-0.5'>
                <span className='text-md font-medium group-data-[tone=inverse]:text-alt'>
                    {option.label}
                </span>
                {option.description && (
                    <span className='text-sm text-subtle group-data-[tone=inverse]:text-alt'>
                        {option.description}
                    </span>
                )}
            </div>
        </>
    );
};

AssigneeOptionRow.displayName = ASSIGNEE_OPTION_ROW_NAME;
