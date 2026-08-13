import { describe, expect, it } from 'vitest';
import { centerTransform, clampScale, fitTransform, MAX_SCALE, MIN_SCALE, zoomAt } from './useDagViewport';

describe('clampScale', () => {
    it('should keep a scale inside the allowed range', () => {
        expect(clampScale(1)).toBe(1);
        expect(clampScale(0.01)).toBe(MIN_SCALE);
        expect(clampScale(99)).toBe(MAX_SCALE);
    });
});

const NO_PADDING = { x: 0, top: 0, bottom: 0 };

describe('fitTransform', () => {
    it('should center content that already fits without scaling it up', () => {
        const transform = fitTransform({ width: 200, height: 100 }, { width: 600, height: 400 }, NO_PADDING);

        expect(transform).toEqual({ x: 200, y: 150, k: 1 });
    });

    it('should scale content down to fit the padded container', () => {
        const padding = { x: 24, top: 24, bottom: 24 };
        const transform = fitTransform({ width: 1000, height: 100 }, { width: 548, height: 400 }, padding);

        expect(transform.k).toBeCloseTo(0.5);
        expect(transform.x).toBeCloseTo(24);
    });

    it('should keep the content above the bottom control band', () => {
        const padding = { x: 24, top: 24, bottom: 68 };
        const transform = fitTransform({ width: 200, height: 100 }, { width: 600, height: 400 }, padding);

        expect(transform.k).toBe(1);
        // Centered in the 24..332 band, so the content bottom clears the controls.
        expect(transform.y).toBeCloseTo(128);
        expect(transform.y + 100).toBeLessThan(400 - padding.bottom);
    });

    it('should not scale below the minimum, letting the content overflow', () => {
        const transform = fitTransform({ width: 10000, height: 100 }, { width: 400, height: 400 });

        expect(transform.k).toBe(MIN_SCALE);
        expect(transform.x).toBeLessThan(0);
    });

    it('should return the identity transform for an empty content or container', () => {
        expect(fitTransform({ width: 0, height: 0 }, { width: 400, height: 400 })).toEqual({ x: 0, y: 0, k: 1 });
        expect(fitTransform({ width: 400, height: 400 }, { width: 0, height: 0 })).toEqual({ x: 0, y: 0, k: 1 });
    });
});

describe('centerTransform', () => {
    it('should center at natural size', () => {
        expect(centerTransform({ width: 200, height: 100 }, { width: 600, height: 400 }, 1, NO_PADDING)).toEqual({
            x: 200,
            y: 150,
            k: 1,
        });
    });
});

describe('zoomAt', () => {
    it('should keep the anchor point in place while zooming in', () => {
        const before = { x: 0, y: 0, k: 1 };
        const point = { x: 100, y: 50 };

        const after = zoomAt(before, 2, point);

        // The content coordinate under the anchor must not move.
        expect((point.x - after.x) / after.k).toBeCloseTo((point.x - before.x) / before.k);
        expect((point.y - after.y) / after.k).toBeCloseTo((point.y - before.y) / before.k);
        expect(after.k).toBe(2);
    });

    it('should clamp the scale and stop moving at the limit', () => {
        const atMax = zoomAt({ x: 10, y: 10, k: MAX_SCALE }, 2, { x: 100, y: 100 });

        expect(atMax).toEqual({ x: 10, y: 10, k: MAX_SCALE });
    });
});
