import { describe, expect, it } from 'vitest';
import type { AiFieldPath } from './ai-protocol';
import { classifyFieldStateRoute } from './ai.router';

describe('classifyFieldStateRoute', () => {
    it('routes topic to the topic atoms', () => {
        expect(classifyFieldStateRoute({ kind: 'topic' })).toBe('topic');
    });

    it('routes a component text path to the page editor', () => {
        expect(classifyFieldStateRoute({ kind: 'componentText', component: '/main/0' })).toBe('pageComponent');
    });

    const fieldKinds: AiFieldPath[] = [
        { kind: 'data', field: 'title' },
        { kind: 'mixin', mixin: 'app:M', field: 'title' },
        { kind: 'pageConfig', field: 'title' },
        { kind: 'componentConfig', component: '/main/0', field: 'title' },
    ];

    it.each(fieldKinds)('routes $kind to the field registry', (path) => {
        expect(classifyFieldStateRoute(path)).toBe('fieldRegistry');
    });
});
