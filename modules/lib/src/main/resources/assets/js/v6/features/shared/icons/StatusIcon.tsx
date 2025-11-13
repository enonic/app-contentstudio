import {cn} from '@enonic/ui';
import {cva, VariantProps} from 'class-variance-authority';
import {CircleAlert, CircleCheck, CircleX, Info, LucideIcon} from 'lucide-react';

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
                'info': [
                    'text-info [&>circle]:fill-current [&>path]:stroke-rev [&>line]:stroke-rev',
                    '[&>path:last-of-type]:-translate-y-[1px]',
                ],
                'ready': 'text-success [&>circle]:fill-current [&>path]:stroke-rev',
                'in-progress': [
                    'text-warn [&>circle]:fill-current [&>path]:stroke-rev [&>line]:stroke-rev',
                    '[&>line:last-of-type]:translate-y-[1px]',
                ],
                'invalid': '[&>path]:scale-[1.25] text-error [&>circle]:fill-current [&>path]:stroke-rev',
            },
        },
    }
);

type Status = VariantProps<typeof statusIconVariants>['status'];

type Props = {
    status: Status;
} & React.ComponentProps<LucideIcon>;


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
};

export const StatusIcon = ({className, status, ...props}: Props): React.ReactElement => {
    const classNames = cn(statusIconVariants({status}), className);
    const Icon = getIcon(status);

    return <Icon className={classNames} aria-label={status} {...props} />;
};
