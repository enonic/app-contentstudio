import {Avatar} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {getInitials} from '../../../../utils/format/initials';

export type IssueDescriptionItemProps = {
    name: string;
    text: string;
};

const ISSUE_DESCRIPTION_ITEM_NAME = 'IssueDescriptionItem';

export const IssueDescriptionItem = ({
    name,
    text,
}: IssueDescriptionItemProps): ReactElement => {
    const label = useI18n('field.description');
    const initials = getInitials(name);

    return (
        <div
            data-component={ISSUE_DESCRIPTION_ITEM_NAME}
            className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 items-center py-2.5'
        >
            <Avatar size='md' className='row-span-2 self-start mt-2.25'>
                <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className='flex flex-col gap-1.5 min-w-0 leading-5.5'>
                <div className='text-md font-semibold'>{label}</div>
                <div className='whitespace-pre-wrap text-md'>{text}</div>
            </div>
        </div>
    );
};

IssueDescriptionItem.displayName = ISSUE_DESCRIPTION_ITEM_NAME;
