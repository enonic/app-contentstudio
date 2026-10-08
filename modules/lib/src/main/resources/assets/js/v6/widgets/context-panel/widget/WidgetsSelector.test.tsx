import { act, fireEvent, render } from '@testing-library/preact';
import { createContext, useContext, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionView } from '../../../../app/view/context/ExtensionView';
import { setContextLayoutMetrics, setContextOpen } from '../../../shared/app-state/browsePanels.store';

vi.mock('@enonic/ui', () => {
    type ChildProps = { children?: ReactNode; className?: string };
    const Container = ({ children, className }: ChildProps) => <div className={className}>{children}</div>;
    const RadioContext = createContext({
        value: '',
        onValueChange: (_value: string) => {},
    });

    return {
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        Button: ({ children, className, 'aria-label': ariaLabel }: ChildProps & { 'aria-label'?: string }) => (
            <button type="button" className={className} aria-label={ariaLabel}>
                {children}
            </button>
        ),
        Menu: Object.assign(({ children }: ChildProps) => <>{children}</>, {
            Trigger: ({
                children,
                onKeyDown,
            }: ChildProps & { onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void }) => (
                <div onKeyDown={onKeyDown}>{children}</div>
            ),
            Portal: ({ children }: ChildProps) => <>{children}</>,
            Content: ({ children }: ChildProps) => <div role="menu">{children}</div>,
            RadioGroup: ({
                children,
                value,
                onValueChange,
            }: ChildProps & { value: string; onValueChange: (value: string) => void }) => (
                <RadioContext.Provider value={{ value, onValueChange }}>{children}</RadioContext.Provider>
            ),
            RadioItem: ({ children, value }: ChildProps & { value: string }) => {
                const { value: selectedValue, onValueChange } = useContext(RadioContext);
                return (
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={selectedValue === value}
                        onClick={() => onValueChange(value)}
                    >
                        {children}
                    </button>
                );
            },
        }),
        Combobox: {
            Root: Container,
            Content: Container,
            Control: Container,
            Search: Container,
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

const createWidgetView = (key: string, name: string): ExtensionView =>
    ({
        getExtensionKey: () => key,
        getExtensionName: () => name,
        getExtensionDescription: () => `${name} description`,
        getExtensionIconUrl: () => `/${key}.svg`,
        setActive: vi.fn(),
    }) as unknown as ExtensionView;

const getRadioItem = (target: HTMLElement, name: string): HTMLElement | undefined =>
    Array.from(target.querySelectorAll<HTMLElement>('[role="menuitemradio"]')).find((item) =>
        item.textContent?.includes(name),
    );

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

        act(() => setContextLayoutMetrics({ totalWidth: 1000, contextWidth: 360, windowWidth: 1000 }));
        rerender(<WidgetsSelector mobileToolbarTarget={target} />);

        expect(container.querySelector('input[role="combobox"]')).not.toBeNull();
        expect(target.querySelector('[data-component="WidgetsSelector"]')).toBeNull();

        act(() => setContextLayoutMetrics({ totalWidth: 700, contextWidth: 360, windowWidth: 700 }));
        rerender(<WidgetsSelector mobileToolbarTarget={target} />);
        expect(target.querySelector('[data-component="WidgetsSelector"]')).not.toBeNull();

        rerender(<WidgetsSelector />);

        expect(container.querySelector('[data-component="WidgetsSelector"]')).not.toBeNull();
        expect(target.querySelector('[data-component="WidgetsSelector"]')).toBeNull();
        target.remove();
    });

    it('shows the selected widget icon and name on a mobile trigger without an input', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        const first = createWidgetView('first', 'First widget');

        render(
            <WidgetsSelector widgetViews={[first]} externalSelectedWidgetView={first} mobileToolbarTarget={target} />,
        );

        expect(target.querySelector('input')).toBeNull();
        const trigger = target.querySelector<HTMLButtonElement>('[data-component="WidgetsSelector"] button');
        expect(trigger?.querySelector('img')?.getAttribute('src')).toBe('/first.svg');
        expect(trigger?.textContent).toContain('First widget');
        target.remove();
    });

    it('keeps Enter and Space from the toolbar while passing other keys through', () => {
        const toolbar = document.createElement('div');
        const target = document.createElement('div');
        const toolbarKeyDown = vi.fn();
        toolbar.addEventListener('keydown', toolbarKeyDown);
        toolbar.appendChild(target);
        document.body.appendChild(toolbar);

        render(<WidgetsSelector mobileToolbarTarget={target} />);

        const trigger = target.querySelector<HTMLButtonElement>('[data-component="WidgetsSelector"] button');
        fireEvent.keyDown(trigger, { key: 'Enter' });
        fireEvent.keyDown(trigger, { key: ' ' });
        expect(toolbarKeyDown).not.toHaveBeenCalled();

        fireEvent.keyDown(trigger, { key: 'a' });
        expect(toolbarKeyDown).toHaveBeenCalledOnce();
        toolbar.remove();
    });

    it('activates a chosen mobile widget and updates its checked state', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        const first = createWidgetView('first', 'First widget');
        const second = createWidgetView('second', 'Second widget');

        render(
            <WidgetsSelector
                widgetViews={[first, second]}
                externalSelectedWidgetView={first}
                mobileToolbarTarget={target}
            />,
        );

        const firstItem = getRadioItem(target, 'First widget');
        const secondItem = getRadioItem(target, 'Second widget');
        expect(firstItem?.getAttribute('aria-checked')).toBe('true');
        expect(secondItem?.getAttribute('aria-checked')).toBe('false');
        fireEvent.click(secondItem);

        expect(second.setActive).toHaveBeenCalledOnce();
        const trigger = target.querySelector<HTMLButtonElement>('[data-component="WidgetsSelector"] button');
        expect(trigger?.textContent).toContain('Second widget');
        expect(getRadioItem(target, 'First widget')?.getAttribute('aria-checked')).toBe('false');
        expect(getRadioItem(target, 'Second widget')?.getAttribute('aria-checked')).toBe('true');
        target.remove();
    });
});
