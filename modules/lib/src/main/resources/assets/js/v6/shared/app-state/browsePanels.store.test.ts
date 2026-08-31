import { beforeEach, describe, expect, it } from 'vitest';
import {
    $isContentFilterOpen,
    $isContextOpen,
    $isMobilePreviewOpen,
    setContentFilterOpen,
    setContextLayoutMetrics,
    setContextOpen,
    setMobilePreviewOpen,
} from './browsePanels.store';

const DESKTOP_METRICS = { totalWidth: 2000, contextWidth: 360, windowWidth: 2000 };
const MOBILE_METRICS = { totalWidth: 700, contextWidth: 360, windowWidth: 700 };

describe('browsePanels.store', () => {
    beforeEach(() => {
        setContextOpen(false);
        setMobilePreviewOpen(false);
        setContentFilterOpen(false);
        setContextLayoutMetrics(DESKTOP_METRICS);
    });

    it('closes the context panel when opening mobile preview', () => {
        setContextOpen(true);
        setMobilePreviewOpen(true);

        expect($isContextOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(true);
    });

    it('closes mobile preview when opening the context panel', () => {
        setMobilePreviewOpen(true);
        setContextOpen(true);

        expect($isMobilePreviewOpen.get()).toBe(false);
        expect($isContextOpen.get()).toBe(true);
    });

    it('allows the filter and context panel to coexist on desktop', () => {
        setContextOpen(true);
        setContentFilterOpen(true);

        expect($isContextOpen.get()).toBe(true);
        expect($isContentFilterOpen.get()).toBe(true);
    });

    it('lets the filter replace an open context panel on mobile', () => {
        setContextLayoutMetrics(MOBILE_METRICS);
        setContextOpen(true);
        setContentFilterOpen(true);

        expect($isContextOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(false);
        expect($isContentFilterOpen.get()).toBe(true);
    });

    it('lets the context panel replace an open filter on mobile', () => {
        setContextLayoutMetrics(MOBILE_METRICS);
        setContentFilterOpen(true);
        setContextOpen(true);

        expect($isContentFilterOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(false);
        expect($isContextOpen.get()).toBe(true);
    });

    it('lets mobile preview replace an open filter', () => {
        setContextLayoutMetrics(MOBILE_METRICS);
        setContentFilterOpen(true);
        setMobilePreviewOpen(true);

        expect($isContentFilterOpen.get()).toBe(false);
        expect($isContextOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(true);
    });

    it('keeps the last-opened panel when entering mobile mode', () => {
        setContextOpen(true);
        setContentFilterOpen(true);

        setContextLayoutMetrics(MOBILE_METRICS);

        expect($isContextOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(false);
        expect($isContentFilterOpen.get()).toBe(true);
    });

    it('keeps context when it was opened last before entering mobile mode', () => {
        setContentFilterOpen(true);
        setContextOpen(true);

        setContextLayoutMetrics(MOBILE_METRICS);

        expect($isContentFilterOpen.get()).toBe(false);
        expect($isMobilePreviewOpen.get()).toBe(false);
        expect($isContextOpen.get()).toBe(true);
    });
});
