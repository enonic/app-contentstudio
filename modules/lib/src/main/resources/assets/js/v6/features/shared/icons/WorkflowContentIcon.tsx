import {WorkflowStateStatus} from '../../../../app/wizard/WorkflowStateManager';
import {ContentIcon} from './ContentIcon';
import {StatusIcon} from './StatusIcon';

type Props = {
    status: WorkflowStateStatus | null;
    contentType: string;
    url?: string | null;
};

export function WorkflowContentIcon({
    status,
    ...props
}: Props): React.ReactElement {
    return (
        <span className='relative inline-flex items-center'>
            <ContentIcon className='w-6 h-6' {...props} />
            {status && <StatusIcon status={status} className='absolute -top-0.75 -right-0.75' />}
        </span>
    );
}
