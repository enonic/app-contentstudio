import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_FRAME_ATTRIBUTE, suppressInitialPreviewFocus } from './suppressInitialPreviewFocus';

describe('suppressInitialPreviewFocus', () => {
    let release: (() => void) | undefined;
    let previewFrame: HTMLIFrameElement | null;
    const originalFrameElement = Object.getOwnPropertyDescriptor(window, 'frameElement');
    const originalElementFocus = HTMLElement.prototype.focus;
    const originalWindowFocus = Object.getOwnPropertyDescriptor(window, 'focus');
    const originalPopoverMethods = ['showPopover', 'togglePopover'].map((method) => ({
        method,
        descriptor: Object.getOwnPropertyDescriptor(HTMLElement.prototype, method),
    }));

    beforeEach(() => {
        previewFrame = document.createElement('iframe');
        previewFrame.setAttribute(PREVIEW_FRAME_ATTRIBUTE, '');
        Object.defineProperty(window, 'frameElement', { configurable: true, get: () => previewFrame });
        vi.spyOn(document, 'hasFocus').mockReturnValue(false);
        document.body.innerHTML = '<input id="field">';
    });

    afterEach(() => {
        release?.();
        release = undefined;
        document.body.innerHTML = '';
        HTMLElement.prototype.focus = originalElementFocus;
        if (originalFrameElement) {
            Object.defineProperty(window, 'frameElement', originalFrameElement);
        } else {
            Reflect.deleteProperty(window, 'frameElement');
        }
        if (originalWindowFocus) {
            Object.defineProperty(window, 'focus', originalWindowFocus);
        }
        originalPopoverMethods.forEach(({ method, descriptor }) => {
            if (descriptor) {
                Object.defineProperty(HTMLElement.prototype, method, descriptor);
            } else {
                Reflect.deleteProperty(HTMLElement.prototype, method);
            }
        });
        vi.restoreAllMocks();
    });

    it('prevents startup focus without emitting a focus event or disabling the input', () => {
        const field = document.querySelector<HTMLInputElement>('#field');
        const onFocus = vi.fn();
        field.addEventListener('focus', onFocus);

        release = suppressInitialPreviewFocus();
        field.focus();

        expect(document.activeElement).not.toBe(field);
        expect(onFocus).not.toHaveBeenCalled();
        expect(field.disabled).toBe(false);
        expect(field.inert).toBe(false);
        expect(field.tabIndex).toBe(0);

        release();
        field.focus();
        expect(document.activeElement).toBe(field);
        expect(onFocus).toHaveBeenCalledOnce();
    });

    it('removes initial autofocus from existing and dynamically added controls', async () => {
        const field = document.querySelector<HTMLInputElement>('#field');
        field.autofocus = true;
        release = suppressInitialPreviewFocus();
        expect(field.autofocus).toBe(false);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = '<input autofocus>';
        document.body.append(wrapper);
        field.autofocus = true;
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(field.autofocus).toBe(false);
        expect(wrapper.querySelector('input').autofocus).toBe(false);

        release();
        expect(field.autofocus).toBe(false);
        expect(wrapper.querySelector('input').autofocus).toBe(false);
        field.autofocus = false;
        field.autofocus = true;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(field.autofocus).toBe(true);
    });

    it.each(['input', 'textarea'] as const)('blocks startup %s.select and restores selection after entry', (tag) => {
        const select = vi.spyOn(tag === 'input' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, 'select');
        const field = document.createElement(tag);
        field.value = 'Select this text';
        document.body.append(field);
        release = suppressInitialPreviewFocus();

        field.select();
        expect(select).not.toHaveBeenCalled();

        vi.mocked(document.hasFocus).mockReturnValue(true);
        field.select();
        expect(select).toHaveBeenCalledOnce();
        expect(field.selectionStart).toBe(0);
        expect(field.selectionEnd).toBe(field.value.length);
    });

    it('does not resurrect autofocus explicitly removed by the site', () => {
        const field = document.querySelector<HTMLInputElement>('#field');
        field.autofocus = true;
        release = suppressInitialPreviewFocus();

        field.autofocus = false;
        release();

        expect(field.autofocus).toBe(false);
    });

    it('keeps autofocus for later dialog and popover interactions', () => {
        document.body.innerHTML = '<dialog><input autofocus></dialog><div popover><input autofocus></div>';

        release = suppressInitialPreviewFocus();

        expect(document.querySelectorAll('[autofocus]')).toHaveLength(2);
        release();
        expect(document.querySelectorAll('[autofocus]')).toHaveLength(2);
    });

    it.each(['show', 'showModal'] as const)('opens startup dialogs through %s without native focus', (method) => {
        document.body.innerHTML = '<dialog><input autofocus></dialog>';
        const dialog = document.querySelector('dialog');
        const input = dialog.querySelector('input');
        vi.spyOn(HTMLDialogElement.prototype, method).mockImplementation(function (this: HTMLDialogElement) {
            this.open = true;
            // Model the native focusing steps, which bypass the public focus() wrapper.
            if (!this.inert) {
                originalElementFocus.call(input);
            }
        });
        const onFocus = vi.fn();
        input.addEventListener('focus', onFocus);
        release = suppressInitialPreviewFocus();

        dialog[method]();

        expect(dialog.open).toBe(true);
        expect(dialog.inert).toBe(false);
        expect(input.disabled).toBe(false);
        expect(input.autofocus).toBe(true);
        expect(onFocus).not.toHaveBeenCalled();

        release();
        dialog[method]();
        expect(document.activeElement).toBe(input);
        expect(onFocus).toHaveBeenCalledOnce();
    });

    it.each(['showPopover', 'togglePopover'] as const)('keeps startup %s behavior and later autofocus', (method) => {
        document.body.innerHTML = '<div popover><input autofocus></div>';
        const popover = document.querySelector<HTMLDivElement>('[popover]');
        const input = popover.querySelector('input');
        const result = method === 'togglePopover' ? true : undefined;
        const nativeOpen = vi.fn(function (this: HTMLElement) {
            this.setAttribute('data-open', '');
            if (!this.inert) {
                originalElementFocus.call(input);
            }
            return result;
        });
        // happy-dom does not implement these APIs yet.
        Object.defineProperty(HTMLElement.prototype, method, { configurable: true, writable: true, value: nativeOpen });
        release = suppressInitialPreviewFocus();

        expect(popover[method]()).toBe(result);
        expect(popover.hasAttribute('data-open')).toBe(true);
        expect(popover.inert).toBe(false);
        expect(input.disabled).toBe(false);
        expect(input.autofocus).toBe(true);
        expect(document.activeElement).not.toBe(input);

        release();
        expect(popover[method]()).toBe(result);
        expect(document.activeElement).toBe(input);
    });

    it('preserves an opening element that was already inert', () => {
        document.body.innerHTML = '<dialog inert="site-value"><input autofocus></dialog>';
        const dialog = document.querySelector('dialog');
        release = suppressInitialPreviewFocus();

        dialog.show();

        expect(dialog.getAttribute('inert')).toBe('site-value');
        release();
        expect(dialog.getAttribute('inert')).toBe('site-value');
    });

    it('restores interactivity when a native opening method throws', () => {
        const dialog = document.createElement('dialog');
        document.body.append(dialog);
        vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(() => {
            throw new DOMException('Cannot open dialog', 'InvalidStateError');
        });
        release = suppressInitialPreviewFocus();

        expect(() => dialog.showModal()).toThrow('Cannot open dialog');
        expect(dialog.inert).toBe(false);
        expect(dialog.hasAttribute('inert')).toBe(false);
    });

    it('keeps inert changes made by site code during native opening', () => {
        const dialog = document.createElement('dialog');
        document.body.append(dialog);
        vi.spyOn(HTMLDialogElement.prototype, 'show').mockImplementation(function (this: HTMLDialogElement) {
            this.setAttribute('inert', 'site-value');
        });
        release = suppressInitialPreviewFocus();

        dialog.show();

        expect(dialog.getAttribute('inert')).toBe('site-value');
    });

    it('allows normal focus when the user has already entered the preview', () => {
        release = suppressInitialPreviewFocus();
        vi.mocked(document.hasFocus).mockReturnValue(true);
        const field = document.querySelector<HTMLInputElement>('#field');

        field.focus();

        expect(document.activeElement).toBe(field);
    });

    it('does not let a scripted pointer event enable startup focus', () => {
        release = suppressInitialPreviewFocus();
        const field = document.querySelector<HTMLInputElement>('#field');

        field.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        field.focus();

        expect(document.activeElement).not.toBe(field);
    });

    it('blocks window.focus during startup and restores it afterward', () => {
        const focusWindow = vi.fn();
        Object.defineProperty(window, 'focus', { configurable: true, writable: true, value: focusWindow });
        release = suppressInitialPreviewFocus();

        window.focus();
        expect(focusWindow).not.toHaveBeenCalled();

        release();
        window.focus();
        expect(focusWindow).toHaveBeenCalledOnce();
    });

    it('does not change unmarked frames or standalone documents', () => {
        window.frameElement.removeAttribute(PREVIEW_FRAME_ATTRIBUTE);
        const originalFocus = HTMLElement.prototype.focus;
        release = suppressInitialPreviewFocus();
        expect(HTMLElement.prototype.focus).toBe(originalFocus);

        previewFrame = null;
        release = suppressInitialPreviewFocus();
        expect(HTMLElement.prototype.focus).toBe(originalFocus);
    });

    it('does not overwrite a site focus wrapper when released', () => {
        const originalFocus = HTMLElement.prototype.focus;
        release = suppressInitialPreviewFocus();
        const guardedFocus = HTMLElement.prototype.focus;
        const siteFocus = function (this: HTMLElement, options?: FocusOptions): void {
            guardedFocus.call(this, options);
        };
        HTMLElement.prototype.focus = siteFocus;

        release();
        expect(HTMLElement.prototype.focus).toBe(siteFocus);
        document.querySelector<HTMLInputElement>('#field').focus();
        expect(document.activeElement.id).toBe('field');
        HTMLElement.prototype.focus = originalFocus;
    });
});
