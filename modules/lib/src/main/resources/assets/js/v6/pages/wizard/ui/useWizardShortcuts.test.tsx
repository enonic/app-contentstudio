import { render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ executeWizardAction: vi.fn() }));

vi.mock('../model/wizardActions.commands', () => ({
    executeWizardAction: mocks.executeWizardAction,
}));

import { useWizardShortcuts } from './useWizardShortcuts';

const Probe = () => {
    useWizardShortcuts();
    return null;
};

const press = (init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
};

describe('useWizardShortcuts', () => {
    let input: HTMLInputElement;

    beforeEach(() => {
        mocks.executeWizardAction.mockReset();
        input = document.createElement('input');
        document.body.appendChild(input);
    });

    afterEach(() => {
        input.remove();
    });

    it('should run the action of a shortcut and take the event', () => {
        render(<Probe />);

        const event = press({ key: 's', code: 'KeyS', ctrlKey: true });

        expect(mocks.executeWizardAction).toHaveBeenCalledWith('save');
        expect(event.defaultPrevented).toBe(true);
    });

    it('should run the global shortcuts from inside an input, and only those', () => {
        render(<Probe />);

        press({ key: 'p', code: 'KeyP', ctrlKey: true, altKey: true }, input);
        press({ key: 'm', code: 'KeyM', altKey: true }, input);

        expect(mocks.executeWizardAction).toHaveBeenCalledTimes(1);
        expect(mocks.executeWizardAction).toHaveBeenCalledWith('publish');
    });

    it('should run a shortcut replayed on the document for the page editor', () => {
        render(<Probe />);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', ctrlKey: true }));

        expect(mocks.executeWizardAction).toHaveBeenCalledWith('saveAndClose');
    });

    it('should leave other keys alone and unbind on unmount', () => {
        const { unmount } = render(<Probe />);

        const event = press({ key: 'x', code: 'KeyX' });
        expect(event.defaultPrevented).toBe(false);

        unmount();
        press({ key: 's', code: 'KeyS', ctrlKey: true });

        expect(mocks.executeWizardAction).not.toHaveBeenCalled();
    });
});
