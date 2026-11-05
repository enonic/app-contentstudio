import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/preact';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setPhrases } from '../../../../../../shared/i18n';
import { ImageUploaderProvider, useImageUploaderContext } from '../ImageUploaderContext';
import { ImageUploaderInputCropButton } from '../ImageUploaderInputControls/ImageUploaderInputCropButton';
import { ImageUploaderInputFocusButton } from '../ImageUploaderInputControls/ImageUploaderInputFocusButton';
import { ImageUploaderInputApplyButton } from '../ImageUploaderInputControls/ImageUploaderInputApplyButton';
import { ImageUploaderInputCancelButton } from '../ImageUploaderInputControls/ImageUploaderInputCancelButton';
import { useImageUploaderApply, useImageUploaderCancel } from '../useImageUploaderActions';
import { getBase64Image } from '../lib/canvas';
import { ImageUploaderInputImage } from './index';

vi.unmock('@enonic/ui');

const { reset, apply, cancel } = vi.hoisted(() => ({
    reset: vi.fn(() => true),
    apply: vi.fn(() => true),
    cancel: vi.fn(() => true),
}));
vi.mock('../useImageUploaderActions', () => ({
    useImageUploaderReset: () => ({ resetImage: reset }),
    useImageUploaderApply: vi.fn(),
    useImageUploaderCancel: vi.fn(),
}));
vi.mock('../ImageUploaderContext', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../ImageUploaderContext')>()),
    useImageUploaderContext: vi.fn(),
}));
vi.mock('../../../FormScopeContext', () => ({ useFormScope: () => ({}) }));
vi.mock('../lib/canvas', () => ({ getBase64Image: vi.fn() }));

type Context = ReturnType<typeof useImageUploaderContext>;
let context: Context;

describe('image action shortcuts', () => {
    beforeEach(() => {
        context = {
            enabled: true,
            mode: 'focus',
            dimensions: { w: 400, h: 200 },
            base64Image: 'image',
            setCrop: vi.fn(),
            setFocus: vi.fn(),
        } as unknown as Context;
        vi.mocked(useImageUploaderContext).mockImplementation(() => context);
        vi.mocked(useImageUploaderApply).mockReturnValue({ canApply: true, apply });
        vi.mocked(useImageUploaderCancel).mockReturnValue({ canCancel: true, cancel });
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.clearAllMocks();
        setPhrases({});
    });

    it.each([
        ['crop', 'Crop keys', 'Crop: 25%, 30%, 75%, 80%', 'Crop: 25.5%, 30%, 75%, 80%'],
        ['focus', 'Focus keys', 'Focus: 25%, 26.7%', 'Focus: 25%, 26.7%'],
    ] as const)(
        'describes %s controls and announces the full-image position after movement pauses',
        (mode, help, initial, next) => {
            vi.useFakeTimers();
            setPhrases({
                'editor.cropimage.keyboard.help': 'Crop keys',
                'editor.cropimage.position': 'Crop: {0}%, {1}%, {2}%, {3}%',
                'editor.setautofocus.keyboard.help': 'Focus keys',
                'editor.setautofocus.position': 'Focus: {0}%, {1}%',
            });
            context.mode = mode;
            context.crop = { x1: 100, y1: 60, x2: 300, y2: 160 };
            context.focus = { x: 150, y: 80 };
            if (mode === 'focus') {
                // Small moves round to the same percentage, but still postpone the announcement.
                context.dimensions = { w: 6000, h: 3000 };
                context.crop = { x1: 1000, y1: 500, x2: 4000, y2: 2000 };
                context.focus = { x: 1500, y: 800 };
            }
            const { container, getByRole, rerender } = render(<ImageUploaderInputImage />);
            vi.mocked(context.setCrop).mockImplementation((crop) => {
                context.crop = crop;
                rerender(<ImageUploaderInputImage />);
            });
            vi.mocked(context.setFocus).mockImplementation((focus) => {
                context.focus = focus;
                rerender(<ImageUploaderInputImage />);
            });
            const svg = container.querySelector('svg')!;
            const description = document.getElementById(svg.getAttribute('aria-describedby')!)!;
            const status = getByRole('status');
            expect(description.textContent).toBe(`${help} ${initial}`);
            expect(status.getAttribute('aria-live')).toBe('polite');

            fireEvent.keyDown(svg, { key: 'ArrowRight' });
            fireEvent.keyUp(svg, { key: 'ArrowRight' });
            act(() => {
                vi.advanceTimersByTime(200);
            });
            fireEvent.keyDown(svg, { key: 'ArrowRight' });
            fireEvent.keyUp(svg, { key: 'ArrowRight' });
            expect(description.textContent).toBe(`${help} ${next}`);
            act(() => {
                vi.advanceTimersByTime(299);
            });
            expect(status.textContent).toBe('');
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(status.textContent).toBe(next);

            act(() => svg.blur());
            expect(status.getAttribute('aria-live')).toBe('off');
            context.enabled = false;
            rerender(<ImageUploaderInputImage />);
            expect(svg.hasAttribute('aria-describedby')).toBe(false);
            expect(container.querySelector('[role="status"]')).toBeNull();
        },
    );

    it.each([
        ['r', reset],
        ['Enter', apply],
        ['Escape', cancel],
    ] as const)('binds %s to its action', (key, action) => {
        const { container } = render(<ImageUploaderInputImage />);
        const svg = container.querySelector('svg')!;
        svg.focus();
        expect(fireEvent.keyDown(svg, { key })).toBe(false);
        fireEvent.keyDown(document.activeElement!, { key, repeat: true });
        expect(action).toHaveBeenCalledTimes(1);
    });

    it('ignores action shortcuts on the focused preview, including Shift+R', () => {
        context.mode = 'ready';
        const { container } = render(<ImageUploaderInputImage />);
        const frame = container.querySelector<HTMLElement>('[data-component="ImageUploaderInputImageFrame"]')!;
        frame.focus();
        for (const key of ['r', 'R', 'Enter', 'Escape']) {
            expect(fireEvent.keyDown(frame, { key, shiftKey: key === 'R' })).toBe(true);
        }
        expect(reset).not.toHaveBeenCalled();
        expect(apply).not.toHaveBeenCalled();
        expect(cancel).not.toHaveBeenCalled();
    });

    it.each([
        ['focus', 'Enter', false],
        ['crop', 'Escape', false],
        ['crop', 'button', false],
        ['crop', 'Enter', true],
    ] as const)(
        'finishes %s using %s without losing or stealing focus (moved away: %s)',
        async (mode, key, moveAway) => {
            const actualContext =
                await vi.importActual<typeof import('../ImageUploaderContext')>('../ImageUploaderContext');
            const actualActions =
                await vi.importActual<typeof import('../useImageUploaderActions')>('../useImageUploaderActions');
            vi.mocked(useImageUploaderContext).mockImplementation(actualContext.useImageUploaderContext);
            vi.mocked(useImageUploaderApply).mockImplementation(actualActions.useImageUploaderApply);
            vi.mocked(useImageUploaderCancel).mockImplementation(actualActions.useImageUploaderCancel);
            const image = { base64Image: 'image', dimensions: { w: 400, h: 200 } };
            vi.mocked(getBase64Image).mockResolvedValue(image);
            setPhrases({ 'editor.cropimage': 'Crop', 'editor.setautofocus': 'Focus', 'action.apply': 'Apply' });
            const Editor = () => {
                const { setImageUrl } = useImageUploaderContext();
                useEffect(() => setImageUrl('image-url'), []);
                return (
                    <>
                        <ImageUploaderInputCropButton />
                        <ImageUploaderInputFocusButton />
                        <ImageUploaderInputApplyButton />
                        <ImageUploaderInputCancelButton />
                        <ImageUploaderInputImage />
                        <input aria-label="Outside" />
                    </>
                );
            };
            const { container, getByRole } = render(
                <ImageUploaderProvider values={[]} enabled>
                    <Editor />
                </ImageUploaderProvider>,
            );
            const trigger = getByRole('button', { name: mode === 'crop' ? 'Crop' : 'Focus' }) as HTMLButtonElement;
            await waitFor(() => expect(trigger.disabled).toBe(false));
            await act(async () => {
                fireEvent.click(trigger);
            });
            const svg = container.querySelector('svg[role="application"]')!;
            expect(document.activeElement).toBe(svg);

            let finishLoad: (image: { base64Image: string; dimensions: { w: number; h: number } }) => void;
            if (mode === 'crop') {
                vi.mocked(getBase64Image).mockReturnValueOnce(
                    new Promise((resolve) => {
                        finishLoad = resolve;
                    }),
                );
            }
            if (key === 'button') {
                const button = getByRole('button', { name: 'Apply' });
                button.focus();
                fireEvent.click(button);
            } else {
                fireEvent.keyDown(svg, { key });
            }
            const outside = getByRole('textbox', { name: 'Outside' });
            if (mode === 'crop') {
                expect(trigger.disabled).toBe(true);
                expect(document.activeElement).not.toBe(trigger);
                if (moveAway) outside.focus();
                await act(async () => {
                    finishLoad(image);
                });
            }
            await waitFor(() => expect(document.activeElement).toBe(moveAway ? outside : trigger));
            if (!moveAway) {
                expect(fireEvent.keyDown(trigger, { key: 'Enter', repeat: true })).toBe(false);
                expect(container.querySelector('svg[role="application"]')).toBeNull();
            }
        },
    );

    it('does not handle action keys when focus is outside the image', () => {
        const { container } = render(<ImageUploaderInputImage />);
        container.querySelector('svg')!.blur();
        for (const key of ['r', 'Enter', 'Escape']) {
            fireEvent.keyDown(container.querySelector('svg')!, { key });
        }
        expect(reset).not.toHaveBeenCalled();
        expect(apply).not.toHaveBeenCalled();
        expect(cancel).not.toHaveBeenCalled();
    });

    it.each([
        ['crop', 612, 10],
        ['focus', 612, 5],
        ['focus', 0, 1],
    ] as const)('scales %s keyboard steps for a %ipx viewport', (mode, viewportWidth, step) => {
        vi.useFakeTimers();
        context.mode = mode;
        context.dimensions = { w: 6000, h: 3000 };
        context.crop = { x1: 1000, y1: 500, x2: 4000, y2: 2000 };
        context.focus = { x: 2500, y: 1250 };
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
            new DOMRect(0, 0, viewportWidth, viewportWidth > 0 ? 312 : 0),
        );
        const { container } = render(<ImageUploaderInputImage />);
        const svg = container.querySelector('svg')!;

        if (mode === 'crop') {
            fireEvent.keyDown(svg, { key: 'ArrowLeft' });
            expect(context.setCrop).toHaveBeenLastCalledWith({ x1: 1000, y1: 500, x2: 4000 - step, y2: 2000 });
            fireEvent.keyUp(svg, { key: 'ArrowLeft' });
            fireEvent.keyDown(svg, { key: 'ArrowLeft', shiftKey: true });
            expect(context.setCrop).toHaveBeenLastCalledWith({ x1: 1000 - step, y1: 500, x2: 4000 - step, y2: 2000 });
            fireEvent.keyUp(svg, { key: 'ArrowLeft' });
            fireEvent.keyDown(svg, { key: 'ArrowDown', altKey: true });
            act(() => {
                vi.advanceTimersByTime(50);
            });
            expect(context.setCrop).toHaveBeenLastCalledWith({
                x1: 1000 - step,
                y1: 500 + step * 2,
                x2: 4000 - step,
                y2: 2000 + step * 2,
            });
        } else {
            fireEvent.keyDown(svg, { key: 'ArrowRight' });
            act(() => {
                vi.advanceTimersByTime(50);
            });
            expect(context.setFocus).toHaveBeenLastCalledWith({ x: 2500 + step * 2, y: 1250 });
        }
    });
});
