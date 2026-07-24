import { describe, expect, it } from 'vitest';
import {
    $contextPanelMode,
    setContextLayoutMetrics,
    shouldCollapseContextInitially,
} from './contextPanelMode.store';

// Thresholds from LayoutTokens.contextPanel: mobile <= 720 (total),
// floating when left panel <= 1200, initial collapse when window <= 1920.

describe('$contextPanelMode', () => {
    it('is docked before the layout is measured', () => {
        setContextLayoutMetrics({ totalWidth: 0, contextWidth: 0, windowWidth: 0 });
        expect($contextPanelMode.get()).toBe('docked');
    });

    it('is mobile at or below the mobile threshold', () => {
        setContextLayoutMetrics({ totalWidth: 720, contextWidth: 360, windowWidth: 720 });
        expect($contextPanelMode.get()).toBe('mobile');

        setContextLayoutMetrics({ totalWidth: 721, contextWidth: 0, windowWidth: 721 });
        expect($contextPanelMode.get()).not.toBe('mobile');
    });

    it('is floating when the remaining left panel is at or below the floating threshold', () => {
        setContextLayoutMetrics({ totalWidth: 1500, contextWidth: 360, windowWidth: 1500 });
        expect($contextPanelMode.get()).toBe('floating');
    });

    it('is docked when the remaining left panel is wide enough', () => {
        setContextLayoutMetrics({ totalWidth: 1700, contextWidth: 400, windowWidth: 1700 });
        expect($contextPanelMode.get()).toBe('docked');
    });

    it('reacts to context width changes at constant total width', () => {
        setContextLayoutMetrics({ totalWidth: 1600, contextWidth: 360, windowWidth: 1600 });
        expect($contextPanelMode.get()).toBe('docked');

        setContextLayoutMetrics({ totalWidth: 1600, contextWidth: 500, windowWidth: 1600 });
        expect($contextPanelMode.get()).toBe('floating');
    });
});

describe('shouldCollapseContextInitially', () => {
    // The threshold is measured against window width, which can exceed the layout
    // area (totalWidth) by the app sidebar.
    it('collapses when the window is at or below the initial-collapse threshold', () => {
        setContextLayoutMetrics({ totalWidth: 1860, contextWidth: 360, windowWidth: 1920 });
        expect(shouldCollapseContextInitially()).toBe(true);
    });

    it('collapses when the expected mode is not docked, even on a wide window', () => {
        setContextLayoutMetrics({ totalWidth: 1500, contextWidth: 360, windowWidth: 2200 });
        expect(shouldCollapseContextInitially()).toBe(true);
    });

    it('stays open on a wide window in docked mode', () => {
        setContextLayoutMetrics({ totalWidth: 2140, contextWidth: 500, windowWidth: 2200 });
        expect(shouldCollapseContextInitially()).toBe(false);
    });
});
