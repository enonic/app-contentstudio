import { describe, expect, it } from 'vitest';
import {
    $contextPanelMode,
    setContextLayoutMetrics,
    shouldCollapseContextInitially,
} from './contextPanelMode.store';

// Thresholds from LayoutTokens.contextPanel: mobile <= 720 (total),
// floating when left panel <= 1200, initial collapse when total <= 1920.

describe('$contextPanelMode', () => {
    it('is docked before the layout is measured', () => {
        setContextLayoutMetrics({ totalWidth: 0, contextWidth: 0 });
        expect($contextPanelMode.get()).toBe('docked');
    });

    it('is mobile at or below the mobile threshold', () => {
        setContextLayoutMetrics({ totalWidth: 720, contextWidth: 360 });
        expect($contextPanelMode.get()).toBe('mobile');

        setContextLayoutMetrics({ totalWidth: 721, contextWidth: 0 });
        expect($contextPanelMode.get()).not.toBe('mobile');
    });

    it('is floating when the remaining left panel is at or below the floating threshold', () => {
        setContextLayoutMetrics({ totalWidth: 1500, contextWidth: 360 });
        expect($contextPanelMode.get()).toBe('floating');
    });

    it('is docked when the remaining left panel is wide enough', () => {
        setContextLayoutMetrics({ totalWidth: 1700, contextWidth: 400 });
        expect($contextPanelMode.get()).toBe('docked');
    });

    it('reacts to context width changes at constant total width', () => {
        setContextLayoutMetrics({ totalWidth: 1600, contextWidth: 360 });
        expect($contextPanelMode.get()).toBe('docked');

        setContextLayoutMetrics({ totalWidth: 1600, contextWidth: 500 });
        expect($contextPanelMode.get()).toBe('floating');
    });
});

describe('shouldCollapseContextInitially', () => {
    it('collapses at or below the initial-collapse threshold', () => {
        setContextLayoutMetrics({ totalWidth: 1920, contextWidth: 360 });
        expect(shouldCollapseContextInitially()).toBe(true);
    });

    it('collapses when the expected mode is not docked', () => {
        setContextLayoutMetrics({ totalWidth: 1500, contextWidth: 360 });
        expect(shouldCollapseContextInitially()).toBe(true);
    });

    it('stays open on wide screens in docked mode', () => {
        setContextLayoutMetrics({ totalWidth: 2200, contextWidth: 500 });
        expect(shouldCollapseContextInitially()).toBe(false);
    });
});
