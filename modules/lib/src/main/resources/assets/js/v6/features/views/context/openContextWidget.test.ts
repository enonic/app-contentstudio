import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {InspectEvent} from '../../../../app/event/InspectEvent';
import {setRegisteredWidgets} from '../../store/contextWidgets.store';
import {isContextWidgetRegistered, openContextWidget} from './openContextWidget';

const LAYERS = {name: 'layers', applicationKey: 'com.cs-plus', key: 'com.cs-plus:layers'};
const VERSIONS = {name: 'versions', applicationKey: 'com.cs', key: 'com.cs:versions'};

let captured: InspectEvent[] = [];

const handler = (event: InspectEvent) => {
    captured.push(event);
};

beforeEach(() => {
    captured = [];
    InspectEvent.on(handler);
});

afterEach(() => {
    InspectEvent.un(handler);
    setRegisteredWidgets([]);
});

describe('isContextWidgetRegistered', () => {
    it('should return false when no widget matches the name', () => {
        setRegisteredWidgets([VERSIONS]);
        expect(isContextWidgetRegistered('layers')).toBe(false);
    });

    it('should return true when a widget with the name is registered', () => {
        setRegisteredWidgets([LAYERS]);
        expect(isContextWidgetRegistered('layers')).toBe(true);
    });

    it('should match against the provided applicationKey', () => {
        setRegisteredWidgets([LAYERS]);
        expect(isContextWidgetRegistered('layers', 'com.cs-plus')).toBe(true);
        expect(isContextWidgetRegistered('layers', 'com.other')).toBe(false);
    });
});

describe('openContextWidget', () => {
    it('should return false and not fire when widget is missing', () => {
        setRegisteredWidgets([VERSIONS]);

        const result = openContextWidget('layers');

        expect(result).toBe(false);
        expect(captured).toHaveLength(0);
    });

    it('should fire InspectEvent and return true when widget is registered', () => {
        setRegisteredWidgets([LAYERS]);

        const result = openContextWidget('layers');

        expect(result).toBe(true);
        expect(captured).toHaveLength(1);
        expect(captured[0].getWidgetName()).toBe('layers');
        expect(captured[0].getWidgetApplicationKey()).toBeUndefined();
        expect(captured[0].isShowPanel()).toBe(true);
    });

    it('should forward applicationKey on the event', () => {
        setRegisteredWidgets([LAYERS]);

        openContextWidget('layers', {applicationKey: 'com.cs-plus'});

        expect(captured[0].getWidgetApplicationKey()).toBe('com.cs-plus');
    });

    it('should respect showPanel option', () => {
        setRegisteredWidgets([LAYERS]);

        openContextWidget('layers', {showPanel: false});

        expect(captured[0].isShowPanel()).toBe(false);
    });

    it('should not fire when applicationKey is pinned and no owner matches', () => {
        setRegisteredWidgets([LAYERS]);

        const result = openContextWidget('layers', {applicationKey: 'com.other'});

        expect(result).toBe(false);
        expect(captured).toHaveLength(0);
    });
});
