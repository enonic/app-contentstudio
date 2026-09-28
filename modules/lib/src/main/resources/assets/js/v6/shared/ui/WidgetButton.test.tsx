import { render, screen } from '@testing-library/preact';
import { Pen } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { WidgetButton } from './WidgetButton';

vi.mock('@enonic/ui', () => ({
    Button: ({ children, ...props }: ComponentPropsWithoutRef<'button'> & { children?: ReactNode }) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
    cn: (...classes: unknown[]) => classes.flat().filter(Boolean).join(' '),
    Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('WidgetButton', () => {
    it('highlights the full mobile row while retaining the desktop icon-button appearance', () => {
        render(<WidgetButton label="Content" icon={Pen} active />);

        const button = screen.getByRole('button', { name: 'Content' });

        expect(button.className.split(' ')).toEqual(
            expect.arrayContaining([
                'size-10',
                'max-sm:h-13',
                'max-sm:w-full',
                'max-sm:justify-start',
                'max-sm:bg-surface-selected',
                'max-sm:before:-inset-x-3.5',
                'sm:bg-btn-active',
            ]),
        );
        expect(button.getAttribute('aria-current')).toBe('page');
        expect(button.querySelector('[data-slot="widget-icon"]')?.className.split(' ')).toEqual(
            expect.arrayContaining(['size-10', 'max-sm:size-9']),
        );
        expect(screen.getByText('Content').classList.contains('sm:hidden')).toBe(true);
    });
});
