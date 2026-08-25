import { IconButton, Tooltip, Button, cn } from '@enonic/ui';
import { CircleQuestionMark, LucideIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

type Props = {
    label: string;
    icon?: LucideIcon;
    iconUrl?: string;
    active?: boolean;
    tooltipClassName?: string;
    disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'disabled'>;

export const WidgetButton = ({
    label,
    icon,
    iconUrl,
    active,
    className,
    tooltipClassName,
    'aria-label': ariaLabel,
    ...buttonProps
}: Props): React.ReactElement => {
    if (!icon && iconUrl) {
        return (
            <Tooltip delay={300} value={label} side="right" className={tooltipClassName}>
                <Button
                    {...buttonProps}
                    className={cn(
                        'size-10 shrink-0 p-1',
                        active && 'bg-surface-selected hover:bg-surface-selected-hover',
                        className,
                    )}
                    aria-label={ariaLabel ?? label}
                >
                    <img
                        className={cn('w-6 invert-100 dark:invert-0 active:invert-0', active && 'invert-0')}
                        src={iconUrl}
                        alt={label}
                    />
                </Button>
            </Tooltip>
        );
    }

    return (
        <Tooltip delay={300} value={label} side="right" className={tooltipClassName}>
            <IconButton
                {...buttonProps}
                className={cn('size-10 shrink-0', className)}
                icon={icon || CircleQuestionMark}
                iconSize={24}
                aria-label={ariaLabel ?? label}
                data-active={active}
            />
        </Tooltip>
    );
};

WidgetButton.displayName = 'WidgetButton';
