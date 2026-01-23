import {Checkbox, useCombobox} from '@enonic/ui';
import {type ReactElement} from 'react';
import {AssigneeOptionRow} from './AssigneeOptionRow';
import type {AssigneeSelectorOption} from './assignee.types';

export type AssigneeOptionItemProps = {
    option: AssigneeSelectorOption;
    value: string;
};

const ASSIGNEE_OPTION_ITEM_NAME = 'AssigneeOptionItem';

export const AssigneeOptionItem = ({option, value}: AssigneeOptionItemProps): ReactElement => {
    const {selection} = useCombobox();
    const isSelected = selection.has(value);

    return (
        <div className='flex w-full items-center gap-x-2.5'>
            <AssigneeOptionRow option={option}/>
            <Checkbox
                checked={isSelected}
                className='ml-auto'
                tabIndex={-1}
                aria-hidden='true'
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => event.preventDefault()}
            />
        </div>
    );
};

AssigneeOptionItem.displayName = ASSIGNEE_OPTION_ITEM_NAME;
