import { Button, cn, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Moon, Sun, SunMoon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { $app, cycleTheme, type Theme } from '../../shared/app-state/app.store';

type Props = {
    className?: string;
};

const ICON_CLASS = 'absolute transition-all duration-300';
const SHOWN_CLASS = 'scale-100 rotate-0 opacity-100';
const HIDDEN_CLASS = 'scale-0 -rotate-90 opacity-0';

const TITLE_KEYS: Record<Theme, string> = {
    light: 'tooltip.theme.light',
    dark: 'tooltip.theme.dark',
    system: 'tooltip.theme.system',
};

const ACTION_KEYS: Record<Theme, string> = {
    light: 'wcag.theme.switchToDark',
    dark: 'wcag.theme.switchToSystem',
    system: 'wcag.theme.switchToLight',
};

export const ThemeSwitcher = ({ className }: Props): ReactElement => {
    const { theme } = useStore($app);

    const title = useI18n(TITLE_KEYS[theme]);
    const action = useI18n(ACTION_KEYS[theme]);

    return (
        <Tooltip delay={300} value={title} asChild>
            <Button
                size="sm"
                variant="text"
                onClick={cycleTheme}
                aria-label={action}
                className={cn('relative size-9 rounded-sm p-0', className)}
            >
                <Sun
                    className={cn(ICON_CLASS, theme === 'light' ? SHOWN_CLASS : HIDDEN_CLASS)}
                    size={16}
                    strokeWidth={1.5}
                />
                <Moon
                    className={cn(ICON_CLASS, theme === 'dark' ? SHOWN_CLASS : HIDDEN_CLASS)}
                    size={16}
                    strokeWidth={1.5}
                />
                <SunMoon
                    className={cn(ICON_CLASS, theme === 'system' ? SHOWN_CLASS : HIDDEN_CLASS)}
                    size={18}
                    strokeWidth={1.5}
                />
            </Button>
        </Tooltip>
    );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';
