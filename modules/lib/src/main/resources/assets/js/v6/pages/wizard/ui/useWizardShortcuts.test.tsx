import { render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ executeWizardAction: vi.fn(), close: vi.fn(), apple: false }));

vi.mock('../model/wizardActions.commands', () => ({
    executeWizardAction: mocks.executeWizardAction,
}));

vi.mock('../model/wizardController', () => ({ getWizardController: () => ({ close: mocks.close }) }));
vi.mock('../../../shared/lib/dom/keyboard', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../shared/lib/dom/keyboard')>();

    return {
        ...original,
        isApplePlatform: () => mocks.apple,
        matchesShortcut: (event: KeyboardEvent, shortcut: string) =>
            original.matchesShortcut(event, shortcut, mocks.apple),
    };
});

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
        mocks.close.mockReset();
        mocks.apple = false;
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
    it('should preview with the platform shortcut', () => {
        render(<Probe />);

        press({ key: ' ', code: 'Space', altKey: true });
        expect(mocks.executeWizardAction).not.toHaveBeenCalled();

        press({ key: ' ', code: 'Space', altKey: true, ctrlKey: true });
        expect(mocks.executeWizardAction).toHaveBeenCalledExactlyOnceWith('preview');

        mocks.apple = true;
        press({ key: ' ', code: 'Space', altKey: true });
        expect(mocks.executeWizardAction).toHaveBeenCalledTimes(2);
    });

    it('should close the wizard, from an input too', () => {
        render(<Probe />);

        const event = press({ key: 'w', code: 'KeyW', altKey: true }, input);

        expect(mocks.close).toHaveBeenCalledTimes(1);
        expect(mocks.executeWizardAction).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(true);
    });
});
