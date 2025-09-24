import type {JSX} from 'react';
import {cva} from 'class-variance-authority';
import {cn} from '@enonic/ui';
import {CircleAlert, CircleCheck, CircleX, type LucideIcon} from 'lucide-react';
import {WorkflowStateStatus} from '../../wizard/WorkflowStateManager';
import {ContentIcon} from './ContentIcon';

type Props = {
    status: WorkflowStateStatus | null;
    contentType: string;
    url?: string | null;
};

const statusIconVariants = cva(
    [
        'rounded-full w-3.75 h-3.75',
        '[&>path]:[vector-effect:non-scaling-stroke] [&>line]:[vector-effect:non-scaling-stroke]',
        '[&>path]:[transform-box:fill-box] [&>path]:[transform-origin:center]',
        '[&>line]:[transform-box:fill-box] [&>line]:[transform-origin:center]',
        '[&>path]:scale-[1.5]',
    ],

    {
        variants: {
            status: {
                'ready':
                    'text-success [&>circle]:fill-current [&>path]:stroke-white',
                'in-progress': [
                    'text-warn [&>circle]:fill-current [&>path]:stroke-white [&>line]:stroke-white',
                    '[&>line:first-of-type]:scale-y-[0.9] [&>line:first-of-type]:-translate-y-[0.25px]',
                    '[&>line:last-of-type]:translate-y-[0.45px] [&>line]:[stroke-linecap:round]'
                ],
                'invalid':
                    '[&>path]:scale-[1.25] text-error [&>circle]:fill-current [&>path]:stroke-white',
            },
        },
    }
);

type StatusIconProps = Pick<Props, 'status'> & React.ComponentProps<LucideIcon>;

const StatusIcon = ({status, className,...props}: StatusIconProps): JSX.Element => {
    const classNames = cn(className, statusIconVariants({status}));
    switch (status) {
    case WorkflowStateStatus.READY:
        return <CircleCheck className={classNames} aria-label={status} {...props} />;
    case WorkflowStateStatus.IN_PROGRESS:
        return <CircleAlert className={classNames} aria-label={status} {...props} />;
    case WorkflowStateStatus.INVALID:
        return <CircleX className={classNames} aria-label={status} {...props} />;
    }
}

export function WorkflowContentIcon({
    status,
    ...props
}: Props): JSX.Element {
    return (
        <span className='relative inline-flex items-center'>
            <ContentIcon className='w-6 h-6' size={24} {...props} />
            {status && <StatusIcon status={status} className='absolute -top-0.75 -right-0.75' />}
        </span>
    );
}
