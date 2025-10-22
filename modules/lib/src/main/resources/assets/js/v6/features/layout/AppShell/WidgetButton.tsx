import {IconButton, Tooltip, Button, cn} from '@enonic/ui';
import {CircleQuestionMark, LucideIcon} from 'lucide-react';
import {ComponentPropsWithoutRef} from 'preact/compat';

type Props = {
    label: string;
    icon?: LucideIcon;
    iconUrl?: string;
    active?: boolean;
} & ComponentPropsWithoutRef<'button'>;

export const WidgetButton = ({
    label,
    icon,
    iconUrl,
    active,
    onClick,
}: Props): React.ReactElement => {
    if (iconUrl) {
        return (
            <Tooltip value={label} side="right">
                <Button
                    className={cn(
                        'size-11.5 p-1',
                        active &&
                            'bg-surface-primary-selected hover:bg-surface-primary-selected-hover'
                    )}
                    aria-label={label}
                    onClick={onClick}
                >
                    <img
                        className={cn('w-6 invert-100 dark:invert-0', active && 'invert-0')}
                        src={iconUrl}
                        alt={label}
                    />
                </Button>
            </Tooltip>
        );
    }

    return (
        <Tooltip value={label} side="right">
            <IconButton
                className={cn(
                    'size-11.5',
                    active &&
                        'bg-surface-primary-selected hover:bg-surface-primary-selected-hover text-white'
                )}
                icon={icon || CircleQuestionMark}
                iconSize={24}
                aria-label={label}
                onClick={onClick}
            />
        </Tooltip>
    );
};

WidgetButton.displayName = 'WidgetButton';
