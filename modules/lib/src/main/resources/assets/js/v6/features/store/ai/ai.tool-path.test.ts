import {describe, expect, it} from 'vitest';
import {toAiToolHelperPath} from './ai.tool-path';

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
