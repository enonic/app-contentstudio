import {describe, expect, it} from 'vitest';
import {toAiToolHelperPath, toPluginContextPath} from './ai.tool-path';

describe('toAiToolHelperPath', () => {
    it('encodes topic', () => {
        expect(toAiToolHelperPath({kind: 'topic'})).toBe('__data__/__topic__');
    });

    it('encodes a data field', () => {
        expect(toAiToolHelperPath({kind: 'data', field: 'foo.bar'})).toBe('__data__/foo/bar');
    });

    it('encodes a mixin field', () => {
        expect(toAiToolHelperPath({kind: 'mixin', mixin: 'com.enonic.app.foo:MyMixin', field: 'heading'}))
            .toBe('__mixins__/com.enonic.app.foo/MyMixin/heading');
    });

    it('encodes a mixin with an empty field', () => {
        expect(toAiToolHelperPath({kind: 'mixin', mixin: 'com.enonic.app.foo:MyMixin', field: ''}))
            .toBe('__mixins__/com.enonic.app.foo/MyMixin');
    });

    it('encodes a page config field', () => {
        expect(toAiToolHelperPath({kind: 'pageConfig', field: 'heading'})).toBe('__page__/__config__/heading');
    });

    it('encodes a component config field', () => {
        expect(toAiToolHelperPath({kind: 'componentConfig', component: '/main/0', field: 'caption'}))
            .toBe('__page__/main/0/__config__/caption');
    });

    it('encodes a component text path', () => {
        expect(toAiToolHelperPath({kind: 'componentText', component: '/main/0'})).toBe('__page__/main/0');
    });
});

describe('toPluginContextPath', () => {
    it('encodes topic to /__topic__', () => {
        expect(toPluginContextPath({kind: 'topic'})).toBe('/__topic__');
    });

    it('encodes a data field with a leading slash and slash-separated tail', () => {
        expect(toPluginContextPath({kind: 'data', field: 'intro'})).toBe('/intro');
        expect(toPluginContextPath({kind: 'data', field: 'foo.bar'})).toBe('/foo/bar');
    });

    it('returns null for kinds the plugin cannot resolve in its form model', () => {
        expect(toPluginContextPath({kind: 'mixin', mixin: 'com.enonic.app.foo:MyMixin', field: 'heading'})).toBeNull();
        expect(toPluginContextPath({kind: 'pageConfig', field: 'heading'})).toBeNull();
        expect(toPluginContextPath({kind: 'componentText', component: '/main/0'})).toBeNull();
        expect(toPluginContextPath({kind: 'componentConfig', component: '/main/0', field: 'caption'})).toBeNull();
    });
});
