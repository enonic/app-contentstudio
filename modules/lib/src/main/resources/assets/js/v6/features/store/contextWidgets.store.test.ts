import {afterEach, describe, expect, it} from 'vitest';
import {
    $registeredWidgetNames,
    $registeredWidgets,
    setRegisteredWidgets,
} from './contextWidgets.store';

afterEach(() => {
    setRegisteredWidgets([]);
});

describe('$registeredWidgets', () => {
    it('should publish the widgets passed to setRegisteredWidgets', () => {
        const widgets = [{name: 'layers', applicationKey: 'a', key: 'a:layers'}];

        setRegisteredWidgets(widgets);

        expect($registeredWidgets.get()).toEqual(widgets);
    });
});

describe('$registeredWidgetNames', () => {
    it('should expose descriptor names as a Set', () => {
        setRegisteredWidgets([
            {name: 'layers', applicationKey: 'a', key: 'a:layers'},
            {name: 'versions', applicationKey: 'b', key: 'b:versions'},
        ]);

        const names = $registeredWidgetNames.get();

        expect(names.has('layers')).toBe(true);
        expect(names.has('versions')).toBe(true);
        expect(names.has('missing')).toBe(false);
        expect(names.size).toBe(2);
    });

    it('should deduplicate names when two apps share a slot', () => {
        setRegisteredWidgets([
            {name: 'layers', applicationKey: 'a', key: 'a:layers'},
            {name: 'layers', applicationKey: 'b', key: 'b:layers'},
        ]);

        expect($registeredWidgetNames.get().size).toBe(1);
    });

    it('should recompute when widgets change', () => {
        setRegisteredWidgets([{name: 'layers', applicationKey: 'a', key: 'a:layers'}]);
        expect($registeredWidgetNames.get().has('layers')).toBe(true);

        setRegisteredWidgets([]);
        expect($registeredWidgetNames.get().size).toBe(0);
    });
});
