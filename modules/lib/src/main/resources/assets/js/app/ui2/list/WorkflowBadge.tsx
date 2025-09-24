import type {JSX, ReactNode} from 'react';
import type {ContentSummary} from '../../content/ContentSummary';
import {WorkflowStateStatus} from '../../wizard/WorkflowStateManager';
import {CircleCheck, CircleAlert, CircleX} from 'lucide-react';
import {cn} from '@enonic/ui';


type Props = {
    summary?: ContentSummary | null;
    children?: ReactNode;
    overlaySize?: number;
};

export function WorkflowBadge({
                                  summary,
                                  children,
                                  overlaySize = 12,
                              }: Props): JSX.Element | null {
    if (!summary) return <>{children}</>;

    const status: WorkflowStateStatus | null =
        !summary.isValid()
        ? WorkflowStateStatus.INVALID
        : summary.isReady()
          ? WorkflowStateStatus.READY
          : summary.isInProgress()
            ? WorkflowStateStatus.IN_PROGRESS
            : null;

    if (!status) return <>{children}</>;

    const Icon =
        status === WorkflowStateStatus.READY
        ? CircleCheck
        : status === WorkflowStateStatus.IN_PROGRESS
          ? CircleAlert
          : CircleX;

    const iconClass = cn(
        'rounded-full w-3.75 h-3.75',
        '[&>path]:[vector-effect:non-scaling-stroke] [&>line]:[vector-effect:non-scaling-stroke]',
        '[&>path]:[transform-box:fill-box] [&>path]:[transform-origin:center]',
        '[&>line]:[transform-box:fill-box] [&>line]:[transform-origin:center]',
        '[&>path]:scale-[1.5]',

        status === WorkflowStateStatus.READY &&
        'text-[var(--color-success)] [&>circle]:fill-current [&>path]:stroke-white',

        status === WorkflowStateStatus.IN_PROGRESS &&
        cn(
            'text-[var(--color-warn)] [&>circle]:fill-current [&>path]:stroke-white [&>line]:stroke-white',
            '[&>line:nth-of-type(1)]:scale-y-[1] [&>line:nth-of-type(1)]:-translate-y-[0.25px]',
            '[&>line:nth-of-type(2)]:translate-y-[0.5px] [&>line]:[stroke-linecap:round]'
        ),

        status === WorkflowStateStatus.INVALID &&
        'text-[var(--color-danger)] [&>circle]:fill-current [&>path]:stroke-white [&>path]:scale-[1.25]',
    );

    return (
        <span className="relative inline-flex items-center h-7.5 w-7.5">
      {children}
            <span className="absolute -top-0.5 -right-0.5">
        <Icon className={iconClass} strokeWidth={2} size={overlaySize} />
      </span>
    </span>
    );
}
