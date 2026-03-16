import {ReactElement} from 'react';
import {Moon, Sun, SunMoon} from 'lucide-react';
import {Button, cn, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {$app, cycleTheme, type Theme} from '../store/app.store';
import {useI18n} from '../hooks/useI18n';

/**
 * Returns the appropriate ARIA label for the next theme in the cycle.
 * This describes what will happen when the button is clicked.
 */
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

/**
 * Returns the title/tooltip text describing the current theme state.
 */
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

/**
 * Theme switcher component that cycles between light, dark, and system themes.
 *
 * Features:
 * - Cycles: Light → Dark → System → Light
 * - Icon animation (Sun/Moon/SunMoon with rotation)
 * - Persists theme preference to localStorage
 * - Syncs across browser tabs
 * - Watches system theme changes in system mode
 * - Accessible with dynamic ARIA labels
 * - Smooth icon transition with rotation effect
 *
 * @example
 * <ThemeSwitcher />
 */
export const ThemeSwitcher = (): ReactElement => {
    const {theme} = useStore($app);

    return (
        <Tooltip value={getThemeTitle(theme, useI18n)} delay={300} asChild>
            <Button
                size="sm"
                variant="text"
                onClick={cycleTheme}
                aria-label={getAriaLabel(theme, useI18n)}
                className="relative h-9 w-9 rounded-full p-0"
            >
                {/* Sun Icon (Visible in Light Mode) */}
                <Sun
                    className={cn(
                        'absolute transition-all duration-300',
                        theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                    )}
                    size={14}
                    strokeWidth={1.5}
                />

                {/* Moon Icon (Visible in Dark Mode) */}
                <Moon
                    className={cn(
                        'absolute transition-all duration-300',
                        theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                    )}
                    size={14}
                    strokeWidth={1.5}
                />

                {/* SunMoon Icon (Visible in System Mode) */}
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
