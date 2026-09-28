import { Button, cn, Tooltip } from '@enonic/ui';
import { CircleQuestionMark, type LucideIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Props = {
    label: string;
    icon?: LucideIcon;
    iconUrl?: string;
    active?: boolean;
    mobileTrailing?: ReactNode;
    tooltipClassName?: string;
    disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'disabled'>;

export const WidgetButton = ({
    label,
    icon,
    iconUrl,
    active,
    mobileTrailing,
    className,
    tooltipClassName,
    'aria-label': ariaLabel,
    ...buttonProps
}: Props): React.ReactElement => {
    const Icon = icon ?? (!iconUrl ? CircleQuestionMark : undefined);
    const hasImageIcon = !icon && !!iconUrl;

    return (
        <Tooltip delay={300} value={label} side="right" className={tooltipClassName}>
            <Button
                {...buttonProps}
                className={cn(
                    'size-10 shrink-0 p-0 max-sm:h-13 max-sm:w-full max-sm:justify-start max-sm:gap-2',
                    active && [
                        'max-sm:relative max-sm:isolate max-sm:overflow-visible max-sm:bg-surface-selected max-sm:text-alt',
                        "max-sm:before:pointer-events-none max-sm:before:absolute max-sm:before:inset-y-0 max-sm:before:-inset-x-3.5 max-sm:before:z-0 max-sm:before:bg-surface-selected max-sm:before:content-['']",
                        'max-sm:hover:bg-surface-selected-hover max-sm:hover:text-alt max-sm:hover:before:bg-surface-selected-hover',
                        hasImageIcon
                            ? 'sm:bg-surface-selected sm:hover:bg-surface-selected-hover'
                            : 'sm:bg-btn-active sm:text-alt sm:hover:bg-btn-active sm:hover:text-alt',
                    ],
                    className,
                )}
                aria-label={ariaLabel ?? label}
                aria-current={active ? 'page' : undefined}
            >
                <span
                    data-slot="widget-icon"
                    className="relative z-10 flex size-10 shrink-0 items-center justify-center max-sm:size-9"
                    aria-hidden="true"
                >
                    {Icon ? (
                        <Icon className="size-6" strokeWidth={1.5} />
                    ) : (
                        <img
                            className={cn(
                                'size-6 shrink-0 invert-100 dark:invert-0 active:invert-0',
                                active && 'invert-0',
                            )}
                            src={iconUrl}
                            alt=""
                        />
                    )}
                </span>
                <span className="relative z-10 min-w-0 truncate sm:hidden">{label}</span>
                {mobileTrailing && <span className="relative z-10 ml-auto shrink-0 sm:hidden">{mobileTrailing}</span>}
            </Button>
        </Tooltip>
    );
};

WidgetButton.displayName = 'WidgetButton';
