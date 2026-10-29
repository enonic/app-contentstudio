import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setContextLayoutMetrics, setContextOpen } from '../../shared/app-state/browsePanels.store';
import type { ContextWidget } from './model/contextWidget.types';
import { $activeWidgetId, $isContextOpen, setContextWidgets } from './model/contextWidgets.store';
import { isContextWidgetRegistered, openContextWidget } from './openContextWidget';

const widget = (applicationKey: string, name: string): ContextWidget => ({
    key: `${applicationKey}:${name}`,
    name,
    applicationKey,
    title: name,
    description: '',
});

const DETAILS = widget('com.cs', 'details');
const LAYERS = widget('com.cs-plus', 'layers');
const VERSIONS = widget('com.cs', 'versions');

beforeEach(() => {
    setContextLayoutMetrics({ totalWidth: 1400, contextWidth: 360, windowWidth: 1400 });
    setContextOpen(false);
});

afterEach(() => {
    setContextWidgets([]);
});

describe('isContextWidgetRegistered', () => {
    it('should return false when no widget matches the name', () => {
        setContextWidgets([VERSIONS]);
        expect(isContextWidgetRegistered('layers')).toBe(false);
    });

    it('should return true when a widget with the name is registered', () => {
        setContextWidgets([LAYERS]);
        expect(isContextWidgetRegistered('layers')).toBe(true);
    });

    it('should match against the provided applicationKey', () => {
        setContextWidgets([LAYERS]);
        expect(isContextWidgetRegistered('layers', 'com.cs-plus')).toBe(true);
        expect(isContextWidgetRegistered('layers', 'com.other')).toBe(false);
    });
});

describe('openContextWidget', () => {
    it('should return false and change nothing when the widget is missing', () => {
        setContextWidgets([DETAILS, VERSIONS], DETAILS.key);

        expect(openContextWidget('layers')).toBe(false);
        expect($activeWidgetId.get()).toBe(DETAILS.key);
        expect($isContextOpen.get()).toBe(false);
    });

    it('should activate the widget and open the panel', () => {
        setContextWidgets([DETAILS, LAYERS], DETAILS.key);

        expect(openContextWidget('layers')).toBe(true);
        expect($activeWidgetId.get()).toBe(LAYERS.key);
        expect($isContextOpen.get()).toBe(true);
    });

    it('should pick the widget of the given application', () => {
        setContextWidgets([DETAILS, widget('com.other', 'layers'), LAYERS], DETAILS.key);

        openContextWidget('layers', { applicationKey: 'com.cs-plus' });

        expect($activeWidgetId.get()).toBe(LAYERS.key);
    });

    it('should respect the showPanel option', () => {
        setContextWidgets([DETAILS, LAYERS], DETAILS.key);

        openContextWidget('layers', { showPanel: false });

        expect($activeWidgetId.get()).toBe(LAYERS.key);
        expect($isContextOpen.get()).toBe(false);
    });

    it('should not activate when the applicationKey is pinned and no owner matches', () => {
        setContextWidgets([DETAILS, LAYERS], DETAILS.key);

        expect(openContextWidget('layers', { applicationKey: 'com.other' })).toBe(false);
        expect($activeWidgetId.get()).toBe(DETAILS.key);
    });
});
