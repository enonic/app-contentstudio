import { render } from '@testing-library/preact';
import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setContextLayoutMetrics, setContextOpen } from '../../../shared/app-state/browsePanels.store';

vi.mock('@enonic/ui', () => {
    type ChildProps = { children?: ReactNode; className?: string };
    const Container = ({ children, className }: ChildProps) => <div className={className}>{children}</div>;

    return {
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        Combobox: {
            Root: Container,
            Content: Container,
            Control: Container,
            Search: ({
                children,
                className,
                onKeyDown,
            }: ChildProps & { onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void }) => (
                <div className={className} onKeyDown={onKeyDown}>
                    {children}
                </div>
            ),
            Input: (props: Record<string, unknown>) => <input role="combobox" {...props} />,
            Toggle: () => <button type="button" />,
            Portal: ({ children }: ChildProps) => <>{children}</>,
            Popup: Container,
        },
        Listbox: {
            Content: Container,
            Item: Container,
        },
    };
});

import { WidgetsSelector } from './WidgetsSelector';

vi.mock('../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

describe('WidgetsSelector', () => {
    beforeEach(() => {
        setContextOpen(false);
        setContextLayoutMetrics({ totalWidth: 700, contextWidth: 360, windowWidth: 700 });
        setContextOpen(true);
    });

    it('moves to a mobile toolbar target supplied after the initial render', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        const { container, rerender } = render(<WidgetsSelector />);

        expect(container.querySelector('[data-component="WidgetsSelector"]')).not.toBeNull();

        rerender(<WidgetsSelector mobileToolbarTarget={target} />);

        expect(container.querySelector('[data-component="WidgetsSelector"]')).toBeNull();
        expect(target.querySelector('[data-component="WidgetsSelector"]')).not.toBeNull();

        rerender(<WidgetsSelector />);

        expect(container.querySelector('[data-component="WidgetsSelector"]')).not.toBeNull();
        expect(target.querySelector('[data-component="WidgetsSelector"]')).toBeNull();
        target.remove();
    });

    it('keeps editable input keys from reaching the mobile toolbar', () => {
        const toolbar = document.createElement('div');
        const target = document.createElement('div');
        const toolbarKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
        toolbar.addEventListener('keydown', toolbarKeyDown);
        toolbar.appendChild(target);
        document.body.appendChild(toolbar);

        render(<WidgetsSelector mobileToolbarTarget={target} />);

        const input = target.querySelector<HTMLInputElement>('[role="combobox"]');
        if (!input) {
            throw new Error(`Expected a combobox input in: ${target.innerHTML}`);
        }

        for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape']) {
            const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
            input.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
        }

        expect(toolbarKeyDown).not.toHaveBeenCalled();

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
        expect(toolbarKeyDown).toHaveBeenCalledOnce();

        toolbar.remove();
    });
});
