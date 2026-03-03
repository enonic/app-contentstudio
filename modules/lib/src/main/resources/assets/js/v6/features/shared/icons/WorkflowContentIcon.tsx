import {ContentIcon} from './ContentIcon';
import {StatusIcon} from './StatusIcon';
import type {ContentState} from '../../../../app/content/ContentState';

type Props = {
    status: ContentState | null;
    contentType: string;
    url?: string | null;
};

export function WorkflowContentIcon({
    status,
    ...props
}: Props): React.ReactElement {
    return (
        <span className='relative inline-flex items-center'>
            <ContentIcon className='size-6' {...props} />
            {status && <StatusIcon status={status} className='absolute -top-0.75 -right-0.75' />}
        </span>
    );
}

WorkflowContentIcon.displayName = 'WorkflowContentIcon';
