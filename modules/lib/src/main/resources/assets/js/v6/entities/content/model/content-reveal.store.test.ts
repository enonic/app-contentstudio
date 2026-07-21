import { beforeEach, describe, expect, it } from 'vitest';
import { $revealScrollTarget, clearRevealScroll, requestRevealScroll } from './content-reveal.store';

describe('content-reveal.store', () => {
    beforeEach(() => {
        clearRevealScroll();
    });

    it('defaults to null', () => {
        expect($revealScrollTarget.get()).toBeNull();
    });

    it('requestRevealScroll sets the target id', () => {
        requestRevealScroll('abc');
        expect($revealScrollTarget.get()).toBe('abc');
    });

    it('clearRevealScroll resets to null', () => {
        requestRevealScroll('abc');
        clearRevealScroll();
        expect($revealScrollTarget.get()).toBeNull();
    });

    it('clearRevealScroll is a no-op when already null', () => {
        clearRevealScroll();
        expect($revealScrollTarget.get()).toBeNull();
    });
});
