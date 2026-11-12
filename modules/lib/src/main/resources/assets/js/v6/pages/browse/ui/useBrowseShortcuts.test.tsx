import { render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ executeBrowseAction: vi.fn() }));

vi.mock('../model/browseActions.commands', () => ({
    executeBrowseAction: mocks.executeBrowseAction,
}));

vi.mock('../model/browseActions.store', () => ({
    BROWSE_ACTIONS: [
        { id: 'new', shortcut: 'alt+n' },
        { id: 'duplicate' },
        { id: 'preview', shortcut: 'alt+space', global: true },
    ],
}));

import { useBrowseShortcuts } from './useBrowseShortcuts';

const Probe = ({ active }: { active: boolean }) => {
    useBrowseShortcuts(active);
    return null;
};

const press = (init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
};

describe('useBrowseShortcuts', () => {
    beforeEach(() => {
        mocks.executeBrowseAction.mockReset();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should run the action of a pressed shortcut and keep the browser from handling it', () => {
        render(<Probe active />);

        const event = press({ key: 'n', code: 'KeyN', altKey: true });

        expect(mocks.executeBrowseAction).toHaveBeenCalledWith('new');
        expect(event.defaultPrevented).toBe(true);
    });

    it('should ignore keys while inactive', () => {
        render(<Probe active={false} />);

        press({ key: 'n', code: 'KeyN', altKey: true });

        expect(mocks.executeBrowseAction).not.toHaveBeenCalled();
    });

    it('should unbind when it becomes inactive', () => {
        const { rerender } = render(<Probe active />);
        rerender(<Probe active={false} />);

        press({ key: 'n', code: 'KeyN', altKey: true });

        expect(mocks.executeBrowseAction).not.toHaveBeenCalled();
    });

    it('should leave text fields alone except for global shortcuts', () => {
        render(<Probe active />);
        const input = document.createElement('input');
        document.body.append(input);

        press({ key: 'n', code: 'KeyN', altKey: true }, input);
        expect(mocks.executeBrowseAction).not.toHaveBeenCalled();

        press({ key: ' ', code: 'Space', altKey: true }, input);
        expect(mocks.executeBrowseAction).toHaveBeenCalledWith('preview');
    });

    it('should ignore keys while a modal dialog is open', () => {
        render(<Probe active />);
        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        document.body.append(modal);

        press({ key: 'n', code: 'KeyN', altKey: true });

        expect(mocks.executeBrowseAction).not.toHaveBeenCalled();
    });
});
