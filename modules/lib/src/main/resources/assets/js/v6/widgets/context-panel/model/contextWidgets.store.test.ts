import { afterEach, describe, expect, it } from 'vitest';
import type { ContextWidget } from './contextWidget.types';
import {
    $activeWidget,
    $activeWidgetId,
    $contextWidgets,
    $registeredWidgetNames,
    activateDefaultWidget,
    addContextWidget,
    findContextWidget,
    removeContextWidgetsByApplication,
    setActiveWidget,
    setActiveWidgetByName,
    setContextWidgets,
    setDefaultWidget,
} from './contextWidgets.store';

const widget = (applicationKey: string, name: string, extra: Partial<ContextWidget> = {}): ContextWidget => ({
    key: `${applicationKey}:${name}`,
    name,
    applicationKey,
    title: name,
    description: '',
    ...extra,
});

const DETAILS = widget('studio', 'details');
const VERSIONS = widget('studio', 'versions');
const LAYERS = widget('plus', 'layers', { url: '/plus/layers' });

afterEach(() => {
    setContextWidgets([]);
});

describe('setContextWidgets', () => {
    it('should activate the default widget', () => {
        setContextWidgets([DETAILS, VERSIONS], DETAILS.key);

        expect($contextWidgets.get()).toEqual([DETAILS, VERSIONS]);
        expect($activeWidget.get()).toBe(DETAILS);
    });

    it('should leave no widget active without a default', () => {
        setActiveWidget(undefined);
        setContextWidgets([DETAILS]);

        expect($activeWidgetId.get()).toBeUndefined();
    });
});

describe('addContextWidget', () => {
    it('should append a new widget and keep the active one', () => {
        setContextWidgets([DETAILS], DETAILS.key);

        addContextWidget(LAYERS);

        expect($contextWidgets.get()).toEqual([DETAILS, LAYERS]);
        expect($activeWidgetId.get()).toBe(DETAILS.key);
    });

    it('should replace a widget with the same key in place', () => {
        setContextWidgets([DETAILS, LAYERS, VERSIONS], LAYERS.key);
        const updated = { ...LAYERS, title: 'Layers v2' };

        addContextWidget(updated);

        expect($contextWidgets.get()).toEqual([DETAILS, updated, VERSIONS]);
        expect($activeWidget.get()).toBe(updated);
    });
});

describe('removeContextWidgetsByApplication', () => {
    it('should fall back to the default widget when the active one is removed', () => {
        setContextWidgets([DETAILS, LAYERS], DETAILS.key);
        setActiveWidget(LAYERS.key);

        removeContextWidgetsByApplication('plus');

        expect($contextWidgets.get()).toEqual([DETAILS]);
        expect($activeWidgetId.get()).toBe(DETAILS.key);
    });

    it('should keep the active widget when another application is removed', () => {
        setContextWidgets([DETAILS, VERSIONS, LAYERS], DETAILS.key);
        setActiveWidget(VERSIONS.key);

        removeContextWidgetsByApplication('plus');

        expect($activeWidgetId.get()).toBe(VERSIONS.key);
    });
});

describe('setActiveWidget', () => {
    it('should ignore unknown keys', () => {
        setContextWidgets([DETAILS], DETAILS.key);

        setActiveWidget('studio:missing');

        expect($activeWidgetId.get()).toBe(DETAILS.key);
    });
});

describe('setActiveWidgetByName', () => {
    it('should activate the first widget with the name', () => {
        setContextWidgets([DETAILS, widget('a', 'layers'), widget('b', 'layers')], DETAILS.key);

        expect(setActiveWidgetByName('layers')).toBe(true);
        expect($activeWidgetId.get()).toBe('a:layers');
    });

    it('should match the application key when given', () => {
        setContextWidgets([DETAILS, widget('a', 'layers'), widget('b', 'layers')], DETAILS.key);

        setActiveWidgetByName('layers', 'b');

        expect($activeWidgetId.get()).toBe('b:layers');
    });

    it('should return false when nothing matches', () => {
        setContextWidgets([DETAILS], DETAILS.key);

        expect(setActiveWidgetByName('layers')).toBe(false);
        expect(findContextWidget('layers')).toBeUndefined();
        expect($activeWidgetId.get()).toBe(DETAILS.key);
    });
});

describe('activateDefaultWidget', () => {
    it('should activate the widget set as default', () => {
        setContextWidgets([DETAILS, VERSIONS], DETAILS.key);

        setDefaultWidget(VERSIONS.key);
        activateDefaultWidget();

        expect($activeWidgetId.get()).toBe(VERSIONS.key);
    });
});

describe('$registeredWidgetNames', () => {
    it('should deduplicate names when two apps share a slot', () => {
        setContextWidgets([widget('a', 'layers'), widget('b', 'layers'), VERSIONS]);

        const names = $registeredWidgetNames.get();

        expect(names.has('layers')).toBe(true);
        expect(names.has('versions')).toBe(true);
        expect(names.size).toBe(2);
    });

    it('should recompute when widgets change', () => {
        setContextWidgets([widget('a', 'layers')]);
        expect($registeredWidgetNames.get().has('layers')).toBe(true);

        setContextWidgets([]);
        expect($registeredWidgetNames.get().size).toBe(0);
    });
});
