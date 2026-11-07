import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { ImageUploaderInputCropSvg } from './ImageUploaderInputCropSvg';

vi.mock('../ImageUploaderContext', () => ({ useImageUploaderContext: vi.fn() }));

type Context = ReturnType<typeof useImageUploaderContext>;
let context: Context;

function renderCrop(keyboardStep = 4) {
    const result = render(<ImageUploaderInputCropSvg keyboardStep={keyboardStep} pixelRatio={1} />);
    vi.mocked(context.setCrop).mockImplementation((crop) => {
        context.crop = crop;
        result.rerender(<ImageUploaderInputCropSvg keyboardStep={keyboardStep} pixelRatio={1} />);
    });
    return result.container.querySelector('svg')!;
}

function repeat() {
    act(() => {
        vi.advanceTimersByTime(50);
    });
}

describe('crop keyboard controls', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        context = {
            enabled: true,
            mode: 'crop',
            dimensions: { w: 400, h: 200 },
            crop: { x1: 100, y1: 60, x2: 300, y2: 160 },
            setCrop: vi.fn(),
        } as unknown as Context;
        vi.mocked(useImageUploaderContext).mockImplementation(() => context);
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('shrinks the opposite edge and switches to expansion when Shift is added', () => {
        const svg = renderCrop();
        fireEvent.keyDown(svg, { key: 'ArrowLeft' });
        expect(context.crop).toEqual({ x1: 100, y1: 60, x2: 296, y2: 160 });

        fireEvent.keyDown(svg, { key: 'Shift', shiftKey: true });
        repeat();
        expect(context.crop).toEqual({ x1: 96, y1: 60, x2: 296, y2: 160 });
    });

    it('expands all held arrows when Shift is added, ignoring stale native repeats', () => {
        const svg = renderCrop();
        for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
            fireEvent.keyDown(svg, { key });
        }
        const before = context.crop!;
        fireEvent.keyDown(svg, { key: 'Shift', shiftKey: true });
        fireEvent.keyDown(svg, { key: 'ArrowDown', repeat: true, shiftKey: false });
        repeat();

        expect(context.crop).toEqual({
            x1: before.x1 - 4,
            y1: before.y1 - 4,
            x2: before.x2 + 4,
            y2: before.y2 + 4,
        });
    });

    it('uses Space to shrink all edges and Shift + Space to expand them', () => {
        const svg = renderCrop();
        fireEvent.keyDown(svg, { key: ' ' });
        expect(context.crop).toEqual({ x1: 104, y1: 64, x2: 296, y2: 156 });

        fireEvent.keyDown(svg, { key: 'Shift', shiftKey: true });
        repeat();
        expect(context.crop).toEqual({ x1: 100, y1: 60, x2: 300, y2: 160 });
    });

    it.each([
        ['shrinking', ['ArrowLeft'], {}, { x1: 0, y1: 0, x2: -8, y2: 0 }],
        ['expanding', ['ArrowLeft'], { shiftKey: true }, { x1: -8, y1: 0, x2: 0, y2: 0 }],
        ['moving diagonally', ['ArrowLeft', 'ArrowUp'], { altKey: true }, { x1: -8, y1: -8, x2: -8, y2: -8 }],
        ['resizing all edges', [' '], {}, { x1: 8, y1: 8, x2: -8, y2: -8 }],
    ] as const)('accelerates %s after holding the keys', (_action, keys, modifiers, delta) => {
        context.dimensions = { w: 6000, h: 3000 };
        context.crop = { x1: 1000, y1: 500, x2: 4000, y2: 2000 };
        const svg = renderCrop(1);
        for (const key of keys) {
            fireEvent.keyDown(svg, { key, ...modifiers });
        }
        act(() => {
            vi.advanceTimersByTime(1600);
        });
        const before = context.crop!;
        repeat();
        expect(context.crop).toEqual({
            x1: before.x1 + delta.x1,
            y1: before.y1 + delta.y1,
            x2: before.x2 + delta.x2,
            y2: before.y2 + delta.y2,
        });
    });

    it.each(['altKey', 'ctrlKey'] as const)('moves held directions together with %s', (modifier) => {
        const svg = renderCrop();
        const modifiers = { [modifier]: true };
        expect(fireEvent.keyDown(svg, { key: 'ArrowUp', ...modifiers })).toBe(false);
        repeat();
        expect(context.crop).toEqual({ x1: 100, y1: 52, x2: 300, y2: 152 });

        fireEvent.keyDown(svg, { key: 'ArrowLeft', ...modifiers });
        repeat();
        expect(context.crop).toEqual({ x1: 92, y1: 44, x2: 292, y2: 144 });

        fireEvent.keyUp(svg, { key: 'ArrowUp', ...modifiers });
        repeat();
        expect(context.crop).toEqual({ x1: 88, y1: 44, x2: 288, y2: 144 });

        fireEvent.keyUp(svg, { key: 'ArrowLeft', ...modifiers });
        repeat();
        expect(context.crop).toEqual({ x1: 88, y1: 44, x2: 288, y2: 144 });

        fireEvent.keyDown(svg, { key: 'ArrowRight', ...modifiers });
        repeat();
        expect(context.crop).toEqual({ x1: 96, y1: 44, x2: 296, y2: 144 });
        fireEvent.keyUp(svg, { key: 'ArrowRight', ...modifiers });

        fireEvent.keyDown(svg, { key: 'ArrowRight', metaKey: true });
        repeat();
        expect(context.crop).toEqual({ x1: 96, y1: 44, x2: 296, y2: 144 });
    });
});
