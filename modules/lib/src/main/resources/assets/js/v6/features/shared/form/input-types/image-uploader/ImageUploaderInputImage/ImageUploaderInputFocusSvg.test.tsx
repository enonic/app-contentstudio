import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { ImageUploaderInputFocusSvg } from './ImageUploaderInputFocusSvg';

vi.mock('../ImageUploaderContext', () => ({ useImageUploaderContext: vi.fn() }));

type Context = ReturnType<typeof useImageUploaderContext>;
let context: Context;

function renderFocus(keyboardStep = 4) {
    const result = render(<ImageUploaderInputFocusSvg keyboardStep={keyboardStep} pixelRatio={1} />);
    vi.mocked(context.setFocus).mockImplementation((focus) => {
        context.focus = focus;
        result.rerender(<ImageUploaderInputFocusSvg keyboardStep={keyboardStep} pixelRatio={1} />);
    });
    return { ...result, svg: result.container.querySelector('svg')! };
}

describe('focal point keyboard movement', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        context = {
            enabled: true,
            dimensions: { w: 400, h: 200 },
            mode: 'focus',
            focus: { x: 200, y: 100 },
            setFocus: vi.fn(),
        } as unknown as Context;
        vi.mocked(useImageUploaderContext).mockImplementation(() => context);
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('moves 4px every 50ms and adds/removes a held direction', () => {
        const { svg } = renderFocus();
        fireEvent.keyDown(svg, { key: 'ArrowUp' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 200, y: 92 });

        fireEvent.keyDown(svg, { key: 'ArrowRight' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 208, y: 84 });

        fireEvent.keyUp(svg, { key: 'ArrowUp' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 212, y: 84 });

        fireEvent.keyUp(svg, { key: 'ArrowRight' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 212, y: 84 });
    });

    it('accelerates held movement, keeps diagonals fast and resets after release or blur', () => {
        const { svg } = renderFocus(1);
        fireEvent.keyDown(svg, { key: 'ArrowRight' });
        expect(context.focus).toEqual({ x: 201, y: 100 });

        for (const [elapsed, x] of [
            [350, 208],
            [50, 210],
            [350, 224],
            [50, 228],
            [750, 288],
            [50, 296],
            [100, 312],
        ]) {
            act(() => {
                vi.advanceTimersByTime(elapsed);
            });
            expect(context.focus).toEqual({ x, y: 100 });
        }

        fireEvent.keyDown(svg, { key: 'ArrowUp' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 328, y: 84 });
        fireEvent.keyUp(svg, { key: 'ArrowRight' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(context.focus).toEqual({ x: 328, y: 76 });

        fireEvent.keyUp(svg, { key: 'ArrowUp' });
        fireEvent.keyDown(svg, { key: 'ArrowLeft' });
        expect(context.focus).toEqual({ x: 327, y: 76 });
        act(() => {
            vi.advanceTimersByTime(1600);
            svg.blur();
        });
        const before = context.focus!;
        svg.focus();
        fireEvent.keyDown(svg, { key: 'ArrowRight' });
        expect(context.focus).toEqual({ x: before.x + 1, y: before.y });
    });

    it('stops held movement when the image loses focus', () => {
        const { svg } = renderFocus();
        fireEvent.keyDown(svg, { key: 'ArrowRight' });
        act(() => svg.blur());
        vi.mocked(context.setFocus).mockClear();
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(context.setFocus).not.toHaveBeenCalled();
    });

    it('stops held movement and rejects arrows when editing becomes disabled', () => {
        const { svg, rerender } = renderFocus();
        fireEvent.keyDown(svg, { key: 'ArrowRight' });
        vi.mocked(context.setFocus).mockClear();

        context.enabled = false;
        rerender(<ImageUploaderInputFocusSvg keyboardStep={4} pixelRatio={1} />);
        act(() => {
            vi.advanceTimersByTime(100);
        });
        fireEvent.keyDown(svg, { key: 'ArrowDown' });

        expect(context.setFocus).not.toHaveBeenCalled();
        expect(svg.hasAttribute('tabindex')).toBe(false);
    });
});
