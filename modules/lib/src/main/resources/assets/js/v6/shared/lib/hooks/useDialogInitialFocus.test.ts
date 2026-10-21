import { act, cleanup, renderHook } from '@testing-library/preact';
import type { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDialogInitialFocus } from './useDialogInitialFocus';

describe('useDialogInitialFocus', () => {
    let dialog: HTMLDivElement;
    let primary: HTMLButtonElement;
    let fallback: HTMLButtonElement;
    let primaryRef: RefObject<HTMLButtonElement | null>;
    let fallbackRef: RefObject<HTMLButtonElement | null>;

    beforeEach(() => {
        dialog = document.createElement('div');
        dialog.tabIndex = -1;
        primary = document.createElement('button');
        fallback = document.createElement('button');
        dialog.append(primary, fallback);
        document.body.append(dialog);
        dialog.focus();
        primaryRef = { current: primary };
        fallbackRef = { current: fallback };
    });

    afterEach(() => {
        cleanup();
        dialog.remove();
        vi.restoreAllMocks();
    });

    it('preserves single-target focus and focus options', () => {
        const focus = vi.spyOn(primary, 'focus');
        const options = { preventScroll: true };
        const { result } = renderHook(() => useDialogInitialFocus(primaryRef, false, options));
        const event = new Event('openautofocus', { cancelable: true });

        act(() => result.current(event));

        expect(document.activeElement).toBe(primary);
        expect(focus).toHaveBeenCalledWith(options);
        expect(event.defaultPrevented).toBe(true);
    });

    it('prefers the primary target when both targets are available', () => {
        const { result } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));

        act(() => result.current(new Event('openautofocus')));

        expect(document.activeElement).toBe(primary);
    });

    it('falls back when the primary target is disabled', () => {
        primary.disabled = true;
        const { result } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));

        act(() => result.current(new Event('openautofocus')));

        expect(document.activeElement).toBe(fallback);
    });

    it.each(['hidden', 'inert', 'aria-hidden', 'aria-disabled'])('skips a target inside a %s ancestor', (attribute) => {
        const wrapper = document.createElement('div');
        wrapper.setAttribute(attribute, 'true');
        wrapper.append(primary);
        dialog.prepend(wrapper);
        const { result } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));

        act(() => result.current(new Event('openautofocus')));

        expect(document.activeElement).toBe(fallback);
    });

    it('skips missing and detached targets in priority order', () => {
        primaryRef.current = null;
        const detachedRef = { current: document.createElement('button') };
        const { result } = renderHook(() => useDialogInitialFocus([primaryRef, detachedRef, fallbackRef]));

        act(() => result.current(new Event('openautofocus')));

        expect(document.activeElement).toBe(fallback);
    });

    it('preserves container focus when no target is available', () => {
        primary.disabled = true;
        fallback.disabled = true;
        const { result } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));
        const event = new Event('openautofocus', { cancelable: true });

        act(() => result.current(event));

        expect(document.activeElement).toBe(dialog);
        expect(event.defaultPrevented).toBe(false);
    });

    it('focuses a fallback that appears after loading even when ready stays false', () => {
        primary.disabled = true;
        fallback.remove();
        fallbackRef.current = null;
        const { result, rerender } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));
        act(() => result.current(new Event('openautofocus')));

        dialog.append(fallback);
        fallbackRef.current = fallback;
        rerender();

        expect(document.activeElement).toBe(fallback);
    });

    it('does not steal focus when a fallback appears after the user focuses another control', () => {
        primary.disabled = true;
        fallbackRef.current = null;
        const { result, rerender } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));
        act(() => result.current(new Event('openautofocus')));
        fallback.focus();

        primary.disabled = false;
        fallbackRef.current = fallback;
        rerender();

        expect(document.activeElement).toBe(fallback);
    });

    it('does not repeat fallback focus after resolving the initial target', () => {
        primary.disabled = true;
        const { result, rerender } = renderHook(() => useDialogInitialFocus([primaryRef, fallbackRef]));
        act(() => result.current(new Event('openautofocus')));
        dialog.focus();
        rerender();

        expect(document.activeElement).toBe(dialog);
    });

    it('retains the existing once-when-ready focus on the primary action', () => {
        primary.disabled = true;
        const { result, rerender } = renderHook(
            ({ ready }) => useDialogInitialFocus([primaryRef, fallbackRef], ready),
            { initialProps: { ready: false } },
        );
        act(() => result.current(new Event('openautofocus')));
        expect(document.activeElement).toBe(fallback);

        primary.disabled = false;
        rerender({ ready: true });
        expect(document.activeElement).toBe(primary);

        fallback.focus();
        rerender({ ready: false });
        rerender({ ready: true });
        expect(document.activeElement).toBe(fallback);
    });
});
