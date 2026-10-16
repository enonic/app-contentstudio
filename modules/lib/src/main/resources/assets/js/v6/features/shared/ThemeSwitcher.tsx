import { Button, cn, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Moon, Sun, SunMoon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { $app, cycleTheme, type Theme } from '../../shared/app-state/app.store';

type Props = {
    className?: string;
};

function getAriaLabel(currentTheme: Theme, i18n: typeof useI18n): string {
    switch (currentTheme) {
        case 'light':
            return i18n('wcag.theme.switchToDark');
        case 'dark':
            return i18n('wcag.theme.switchToSystem');
        case 'system':
            return i18n('wcag.theme.switchToLight');
    }
}

function getThemeTitle(currentTheme: Theme, i18n: typeof useI18n): string {
    switch (currentTheme) {
        case 'light':
            return i18n('tooltip.theme.light');
        case 'dark':
            return i18n('tooltip.theme.dark');
        case 'system':
            return i18n('tooltip.theme.system');
    }
}

export const ThemeSwitcher = ({ className }: Props): ReactElement => {
    const { theme } = useStore($app);

    return (
        <Tooltip delay={300} value={getThemeTitle(theme, useI18n)} asChild>
            <Button
                size="sm"
                variant="text"
                onClick={cycleTheme}
                aria-label={getAriaLabel(theme, useI18n)}
                className={cn('relative size-9 rounded-full p-0', className)}
            >
                <Sun
                    className={cn(
                        'absolute transition-all duration-300',
                        theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                    )}
                    size={14}
                    strokeWidth={1.5}
                />
                <Moon
                    className={cn(
                        'absolute transition-all duration-300',
                        theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                    )}
                    size={14}
                    strokeWidth={1.5}
                />
                <SunMoon
                    className={cn(
                        'absolute transition-all duration-300',
                        theme === 'system' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                    )}
                    size={16}
                    strokeWidth={1.5}
                />
            </Button>
        </Tooltip>
    );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';
