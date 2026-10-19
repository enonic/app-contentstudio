import { describe, expect, it } from 'vitest';
import { resolveBrowsePanelLayout } from './resolveBrowsePanelLayout';

const options = { totalWidth: 2000, panelMinWidth: 300, filterDefaultWidth: 300, contextDefaultWidth: 360 };

describe('resolveBrowsePanelLayout', () => {
    it('should take the filter width from the preview and keep the grid width when the filter opens', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 50, preview: 50 },
            { filter: 15, 'grid-region': 42.5, preview: 42.5 },
            options,
        );

        expect(layout).toEqual({ filter: 15, 'grid-region': 50, preview: 35 });
    });

    it('should keep the docked context width when the filter opens', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 40, preview: 40, context: 20 },
            { filter: 15, 'grid-region': 32.5, preview: 32.5, context: 30 },
            options,
        );

        expect(layout).toEqual({ filter: 15, 'grid-region': 40, preview: 25, context: 20 });
    });

    it('should give the filter width back to the preview and keep the grid width when the filter closes', () => {
        const layout = resolveBrowsePanelLayout(
            { filter: 15, 'grid-region': 50, preview: 35 },
            { 'grid-region': 57.5, preview: 42.5 },
            options,
        );

        expect(layout).toEqual({ 'grid-region': 50, preview: 50 });
    });

    it('should clamp the preview to its minimum width and squeeze the grid for the rest when the filter opens', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 80, preview: 20 },
            { filter: 15, 'grid-region': 68, preview: 17 },
            options,
        );

        expect(layout).toEqual({ filter: 15, 'grid-region': 70, preview: 15 });
    });

    it('should fall back to the default filter width when the last one does not fit', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 20, preview: 80 },
            { filter: 75, 'grid-region': 5, preview: 20 },
            options,
        );

        expect(layout).toEqual({ filter: 15, 'grid-region': 20, preview: 65 });
    });

    it('should take the context width from the grid and keep the preview width when the context docks', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 50, preview: 50 },
            { 'grid-region': 40, preview: 40, context: 20 },
            options,
        );

        expect(layout).toEqual({ 'grid-region': 30, preview: 50, context: 20 });
    });

    it('should keep the filter width when the context docks', () => {
        const layout = resolveBrowsePanelLayout(
            { filter: 15, 'grid-region': 50, preview: 35 },
            { filter: 25, 'grid-region': 25, preview: 20, context: 30 },
            options,
        );

        expect(layout).toEqual({ filter: 15, 'grid-region': 20, preview: 35, context: 30 });
    });

    it('should clamp the grid to its minimum width and squeeze the preview for the rest when the context docks', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 20, preview: 80 },
            { 'grid-region': 16, preview: 64, context: 20 },
            options,
        );

        expect(layout).toEqual({ 'grid-region': 15, preview: 65, context: 20 });
    });

    it('should fall back to the default context width when the last one does not fit', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 25, preview: 75 },
            { 'grid-region': 5, preview: 15, context: 80 },
            options,
        );

        expect(layout).toEqual({ 'grid-region': 15, preview: 67, context: 18 });
    });

    it('should give the context width to the grid and keep the preview width when the context undocks', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 30, preview: 50, context: 20 },
            { 'grid-region': 37.5, preview: 62.5 },
            options,
        );

        expect(layout).toEqual({ 'grid-region': 50, preview: 50 });
    });

    it('should leave the layout to the library when the filter and the context change together', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 50, preview: 50 },
            { filter: 15, 'grid-region': 35, preview: 30, context: 20 },
            options,
        );

        expect(layout).toBeUndefined();
    });

    it('should leave the layout to the library when a panel was collapsed', () => {
        const layout = resolveBrowsePanelLayout(
            { 'grid-region': 100, preview: 0 },
            { filter: 15, 'grid-region': 85, preview: 0 },
            options,
        );

        expect(layout).toBeUndefined();
    });
});
