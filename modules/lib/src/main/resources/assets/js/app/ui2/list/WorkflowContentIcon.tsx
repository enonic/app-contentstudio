import type {JSX, ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {cn} from '@enonic/ui';
import {CircleAlert, CircleCheck, CircleX, type LucideIcon} from 'lucide-react';
import {WorkflowStateStatus} from '../../wizard/WorkflowStateManager';
import {ContentIcon} from './ContentIcon';

type Props = {
    status: WorkflowStateStatus | null;
    contentType: string;
    url?: string | null;
    size?: number;
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
                [WorkflowStateStatus.READY]:
                    'text-[var(--color-success)] [&>circle]:fill-current [&>path]:stroke-white',
                [WorkflowStateStatus.IN_PROGRESS]:
                    cn(
                        'text-[var(--color-warn)] [&>circle]:fill-current [&>path]:stroke-white [&>line]:stroke-white',
                        '[&>line:first-of-type]:scale-y-[0.9] [&>line:first-of-type]:-translate-y-[0.25px]',
                        '[&>line:last-of-type]:translate-y-[0.45px] [&>line]:[stroke-linecap:round]'
                    ),
                [WorkflowStateStatus.INVALID]:
                    '[&>path]:scale-[1.25] text-[var(--color-danger)] [&>circle]:fill-current [&>path]:stroke-white',
            },
        },
    }
);

function iconByStatus(status: WorkflowStateStatus): LucideIcon {
    switch (status) {
    case WorkflowStateStatus.READY:
        return CircleCheck;
    case WorkflowStateStatus.IN_PROGRESS:
        return CircleAlert;
    case WorkflowStateStatus.INVALID:
        return CircleX;
    }
}

export function WorkflowContentIcon({
                                        status,
                                        contentType,
                                        url,
                                        size = 24,
                                    }: Props): JSX.Element {

    let statusIcon: ReactNode = null;
    if (status !== null) {
        const Icon = iconByStatus(status);
        statusIcon = <Icon
            className={cn(statusIconVariants({status}), 'absolute -top-0.5 -right-0.5')}
            strokeWidth={2}
            aria-label={status}
        />

    }
    return (
        <span className="relative inline-flex items-center h-7.5 w-7.5">
            <ContentIcon contentType={contentType} url={url} size={size}/>
            {statusIcon}
        </span>
    );
}
