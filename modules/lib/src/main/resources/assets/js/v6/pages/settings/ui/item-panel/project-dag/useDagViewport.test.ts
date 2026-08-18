import { describe, expect, it } from 'vitest';
import {
    centerTransform,
    clampScale,
    clampTransform,
    fitTransform,
    initialTransform,
    MAX_SCALE,
    MIN_READABLE_SCALE,
    MIN_SCALE,
    PAN_MARGIN,
    VIEWPORT_PADDING,
    wheelZoomFactor,
    zoomAt,
} from './useDagViewport';

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

describe('initialTransform', () => {
    const PADDING = { x: 24, top: 24, bottom: 68 };

    it('should fit a graph that stays readable', () => {
        const content = { width: 400, height: 200 };
        const container = { width: 600, height: 400 };

        expect(initialTransform(content, container, PADDING)).toEqual(fitTransform(content, container, PADDING));
    });

    it('should show the first cards at a readable scale instead of fitting everything', () => {
        const transform = initialTransform({ width: 6000, height: 400 }, { width: 600, height: 400 }, PADDING);

        expect(transform).toEqual({ x: PADDING.x, y: PADDING.top, k: MIN_READABLE_SCALE });
    });

    it('should center the axis that still fits', () => {
        const content = { width: 6000, height: 280 };
        const container = { width: 1100, height: 600 };

        const transform = initialTransform(content, container, PADDING);

        expect(transform.x).toBe(PADDING.x);
        // Centered in the 24..532 band: the graph is wide, not tall.
        expect(transform.y).toBeCloseTo(159);
    });

    it('should stay inside the pan bounds, so the first drag does not jump', () => {
        const cases = [
            { content: { width: 6000, height: 280 }, container: { width: 1100, height: 600 } },
            { content: { width: 6000, height: 400 }, container: { width: 600, height: 400 } },
            { content: { width: 300, height: 4000 }, container: { width: 1100, height: 600 } },
        ];

        cases.forEach(({ content, container }) => {
            const transform = initialTransform(content, container, PADDING);

            expect(clampTransform(transform, content, container)).toEqual(transform);
        });
    });

    it('should return the identity transform for an empty content or container', () => {
        expect(initialTransform({ width: 0, height: 0 }, { width: 400, height: 400 })).toEqual({ x: 0, y: 0, k: 1 });
        expect(initialTransform({ width: 400, height: 400 }, { width: 0, height: 0 })).toEqual({ x: 0, y: 0, k: 1 });
    });
});

describe('clampTransform', () => {
    const MARGIN = { x: 100, top: 50, bottom: 80 };

    it('should keep content smaller than the container inside the margins', () => {
        const content = { width: 200, height: 100 };
        const container = { width: 600, height: 400 };

        expect(clampTransform({ x: 5000, y: 5000, k: 1 }, content, container, MARGIN)).toEqual({
            x: 300,
            y: 220,
            k: 1,
        });
        expect(clampTransform({ x: -5000, y: -5000, k: 1 }, content, container, MARGIN)).toEqual({
            x: 100,
            y: 50,
            k: 1,
        });
    });

    it('should stop overflowing content once an edge reaches its margin', () => {
        const content = { width: 2000, height: 1000 };
        const container = { width: 600, height: 400 };

        expect(clampTransform({ x: 900, y: 0, k: 1 }, content, container, MARGIN).x).toBe(100);
        expect(clampTransform({ x: -9000, y: 0, k: 1 }, content, container, MARGIN).x).toBe(-1500);
        expect(clampTransform({ x: 0, y: -9000, k: 1 }, content, container, MARGIN).y).toBe(-680);
    });

    it('should take the scale into account', () => {
        const content = { width: 2000, height: 1000 };
        const container = { width: 600, height: 400 };

        expect(clampTransform({ x: -9000, y: 0, k: 0.25 }, content, container, MARGIN).x).toBe(0);
    });

    it('should leave the transform alone while the container has no size', () => {
        const transform = { x: 5000, y: 5000, k: 1 };

        expect(clampTransform(transform, { width: 200, height: 100 }, { width: 0, height: 0 }, MARGIN)).toBe(transform);
    });

    it('should accept the fitted transform unchanged', () => {
        const content = { width: 1000, height: 900 };
        const container = { width: 600, height: 400 };
        const fitted = fitTransform(content, container);

        expect(clampTransform(fitted, content, container)).toEqual(fitted);
    });

    it('should be looser than the fit padding', () => {
        expect(PAN_MARGIN.x).toBeGreaterThan(VIEWPORT_PADDING.x);
        expect(PAN_MARGIN.top).toBeGreaterThan(VIEWPORT_PADDING.top);
        expect(PAN_MARGIN.bottom).toBeGreaterThan(VIEWPORT_PADDING.bottom);
    });
});

describe('wheelZoomFactor', () => {
    it('should zoom in on a negative delta and out on a positive one', () => {
        expect(wheelZoomFactor(-100)).toBeGreaterThan(1);
        expect(wheelZoomFactor(100)).toBeLessThan(1);
        expect(wheelZoomFactor(0)).toBe(1);
    });

    it('should be symmetric so opposite scrolls cancel out', () => {
        expect(wheelZoomFactor(120) * wheelZoomFactor(-120)).toBeCloseTo(1);
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
