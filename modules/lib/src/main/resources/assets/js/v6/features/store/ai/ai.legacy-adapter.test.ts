import {describe, expect, it} from 'vitest';
import {formatToLegacy, parseLegacy} from './ai.legacy-adapter';

describe('parseLegacy', () => {
    it('parses the topic path', () => {
        expect(parseLegacy('__data__/__topic__')).toEqual({kind: 'topic'});
    });

    it('parses a bare topic path', () => {
        expect(parseLegacy('/__topic__')).toEqual({kind: 'topic'});
    });

    it('parses a data path into a dotted field', () => {
        expect(parseLegacy('__data__/foo/bar')).toEqual({kind: 'data', field: 'foo.bar'});
    });

    it('keeps array indices in data fields', () => {
        expect(parseLegacy('__data__/items/0/title')).toEqual({kind: 'data', field: 'items.0.title'});
    });

    it('parses a mixin path', () => {
        expect(parseLegacy('__mixins__/com.enonic.app.foo/MyMixin/heading')).toEqual({
            kind: 'mixin',
            mixin: 'com.enonic.app.foo:MyMixin',
            field: 'heading',
        });
    });

    it('converts hyphens in the mixin app name to dots', () => {
        expect(parseLegacy('__mixins__/my-app/Seo/title')).toEqual({
            kind: 'mixin',
            mixin: 'my.app:Seo',
            field: 'title',
        });
    });

    it('parses a page config path with no component', () => {
        expect(parseLegacy('__page__/__config__/heading')).toEqual({kind: 'pageConfig', field: 'heading'});
    });

    it('parses a component config path', () => {
        expect(parseLegacy('__page__/main/0/__config__/caption')).toEqual({
            kind: 'componentConfig',
            component: '/main/0',
            field: 'caption',
        });
    });

    it('parses a component text path', () => {
        expect(parseLegacy('__page__/main/0')).toEqual({kind: 'componentText', component: '/main/0'});
    });

    it('returns null for an unrecognized path', () => {
        expect(parseLegacy('nonsense/path')).toBeNull();
    });
});

describe('formatToLegacy', () => {
    it('encodes topic', () => {
        expect(formatToLegacy({kind: 'topic'})).toBe('__data__/__topic__');
    });

    it('encodes a data field', () => {
        expect(formatToLegacy({kind: 'data', field: 'foo.bar'})).toBe('__data__/foo/bar');
    });

    it('encodes a mixin field', () => {
        expect(formatToLegacy({kind: 'mixin', mixin: 'com.enonic.app.foo:MyMixin', field: 'heading'}))
            .toBe('__mixins__/com.enonic.app.foo/MyMixin/heading');
    });

    it('encodes a mixin with an empty field', () => {
        expect(formatToLegacy({kind: 'mixin', mixin: 'com.enonic.app.foo:MyMixin', field: ''}))
            .toBe('__mixins__/com.enonic.app.foo/MyMixin');
    });

    it('encodes a page config field', () => {
        expect(formatToLegacy({kind: 'pageConfig', field: 'heading'})).toBe('__page__/__config__/heading');
    });

    it('encodes a component config field', () => {
        expect(formatToLegacy({kind: 'componentConfig', component: '/main/0', field: 'caption'}))
            .toBe('__page__/main/0/__config__/caption');
    });

    it('encodes a component text path', () => {
        expect(formatToLegacy({kind: 'componentText', component: '/main/0'})).toBe('__page__/main/0');
    });
});

describe('legacy scheme characterization — formatToLegacy(parseLegacy(x)) is canonical', () => {
    const canonicalPaths = [
        '__data__/__topic__',
        '__data__/foo/bar',
        '__data__/items/0/title',
        '__mixins__/com.enonic.app.foo/MyMixin/heading',
        '__page__/__config__/heading',
        '__page__/main/0/__config__/caption',
        '__page__/main/0',
    ];

    it.each(canonicalPaths)('round-trips %s unchanged', (path) => {
        const parsed = parseLegacy(path);
        expect(parsed).not.toBeNull();
        expect(formatToLegacy(parsed)).toBe(path);
    });
});
