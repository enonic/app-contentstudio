import { cn, Tooltip, type TooltipTrigger } from '@enonic/ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, CircleX, Info, type LucideIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactElement } from 'react';
import { useI18n } from '../../lib/hooks/useI18n';

const statusIconVariants = cva(
    [
        'rounded-full w-3.75 h-3.75',
        '[&>path]:[vector-effect:non-scaling-stroke] [&>line]:[vector-effect:non-scaling-stroke]',
        '[&>path]:transform-fill [&>path]:origin-center',
        '[&>line]:transform-fill [&>line]:origin-center',
        '[&>path]:scale-[1.5]',
    ],

    {
        variants: {
            status: {
                info: [
                    'text-info [&>circle]:fill-current [&>path]:stroke-rev [&>line]:stroke-rev',
                    '[&>path:last-of-type]:-translate-y-px',
                ],
                ready: 'text-success [&>circle]:fill-current [&>path]:stroke-rev',
                'in-progress': [
                    'text-warn [&>circle]:fill-current [&>path]:stroke-rev [&>line]:stroke-rev',
                    '[&>line:last-of-type]:translate-y-px',
                ],
                invalid: '[&>path]:scale-[1.25] text-error [&>circle]:fill-current [&>path]:stroke-rev',
            },
        },
    },
);

type Status = VariantProps<typeof statusIconVariants>['status'];

type Props = {
    status: Status;
    withTooltip?: boolean;
    tooltipTrigger?: TooltipTrigger;
    'data-component'?: string;
} & ComponentPropsWithoutRef<LucideIcon>;

function getIcon(status: Status): LucideIcon {
    switch (status) {
        case 'info':
            return Info;
        case 'ready':
            return CircleCheck;
        case 'in-progress':
            return CircleAlert;
        case 'invalid':
            return CircleX;
    }
}

export function getStatusTooltipKey(status: Status): string {
    switch (status) {
        case 'info':
            return 'field.contextPanel.details.sections.info';
        case 'ready':
            return 'tooltip.state.ready';
        case 'in-progress':
            return 'field.workflow.status.inProgress';
        case 'invalid':
            return 'field.invalid';
    }
}

const STATUS_ICON_NAME = 'StatusIcon';

export const StatusIcon = forwardRef<SVGSVGElement, Props>(
    (
        {
            className,
            status,
            withTooltip,
            tooltipTrigger = 'hover',
            'data-component': componentName = STATUS_ICON_NAME,
            ...props
        },
        ref,
    ): ReactElement => {
        const classNames = cn(statusIconVariants({ status }), className);
        const Icon = getIcon(status);
        const tooltip = useI18n(getStatusTooltipKey(status));
        const icon = (
            <Icon
                ref={ref}
                data-component={componentName}
                data-status={status}
                className={classNames}
                role="img"
                aria-label={tooltip}
                {...props}
                focusable={props.tabIndex == null ? 'false' : undefined}
            />
        );

        if (!withTooltip) {
            return icon;
        }

        return (
            <Tooltip side="top" delay={300} value={tooltip} trigger={tooltipTrigger}>
                {icon}
            </Tooltip>
        );
    },
);

StatusIcon.displayName = STATUS_ICON_NAME;
