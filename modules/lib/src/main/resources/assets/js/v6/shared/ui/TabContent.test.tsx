import { Tab } from '@enonic/ui';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabContent } from './TabContent';

vi.unmock('@enonic/ui');

afterEach(cleanup);

describe('TabContent', () => {
    it('keeps every tab target mounted and hidden while mounting only the active body', () => {
        const mount = vi.fn();
        const unmount = vi.fn();

        const Body = ({ name }: { name: string }) => {
            useEffect(() => {
                mount(name);
                return () => unmount(name);
            }, [name]);

            return <input aria-label={`${name} body`} />;
        };

        render(
            <Tab.Root defaultValue="first" autoFocusTrigger={false}>
                <Tab.List aria-label="Example tabs">
                    <Tab.Trigger value="first">First</Tab.Trigger>
                    <Tab.Trigger value="second">Second</Tab.Trigger>
                </Tab.List>
                <TabContent value="first" className="flex">
                    <Body name="First" />
                </TabContent>
                <TabContent value="second" className="flex">
                    <Body name="Second" />
                </TabContent>
            </Tab.Root>,
        );

        const tabs = screen.getAllByRole('tab');
        const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

        for (const [index, panel] of panels.entries()) {
            expect(panel).not.toBeNull();
            expect(panel.getAttribute('role')).toBe('tabpanel');
            expect(panel.getAttribute('aria-labelledby')).toBe(tabs[index].id);
        }
        expect(panels[0].hidden).toBe(false);
        expect(panels[1].hidden).toBe(true);
        expect(panels[1].classList.contains('hidden')).toBe(true);
        expect(screen.queryByRole('textbox', { name: 'Second body' })).toBeNull();
        expect(mount.mock.calls).toEqual([['First']]);

        fireEvent.click(tabs[1]);

        expect(panels[0].isConnected).toBe(true);
        expect(panels[0].hidden).toBe(true);
        expect(panels[0].classList.contains('hidden')).toBe(true);
        expect(panels[1].hidden).toBe(false);
        expect(panels[1].classList.contains('flex')).toBe(true);
        expect(screen.queryByRole('textbox', { name: 'First body' })).toBeNull();
        expect(screen.getByRole('textbox', { name: 'Second body' })).toBeTruthy();
        expect(mount.mock.calls).toEqual([['First'], ['Second']]);
        expect(unmount.mock.calls).toEqual([['First']]);
    });
});
