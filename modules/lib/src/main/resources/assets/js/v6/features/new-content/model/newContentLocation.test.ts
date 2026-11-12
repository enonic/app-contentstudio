import { Messages } from '@enonic/lib-admin-ui/util/Messages';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentPath } from '../../../../app/content/ContentPath';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { getContent, getIdByPath } from '../../../entities/content';
import { getNewContentLocation } from './newContentLocation';

vi.mock('../../../entities/content', () => ({ getContent: vi.fn(), getIdByPath: vi.fn() }));

const content = (path: string, title?: string) =>
    ({
        getPath: () => ContentPath.create().fromString(path).build(),
        getListTitle: () => title,
        getType: () => ({ getLocalName: () => 'folder' }),
    }) as ContentSummary;

beforeEach(() => Messages.setMessages({ 'field.unnamed': 'unnamed' }));
afterEach(() => {
    Messages.setMessages({});
    vi.resetAllMocks();
    vi.restoreAllMocks();
});

describe('getNewContentLocation', () => {
    it('preserves root and named segments regardless of their display titles', () => {
        expect(getNewContentLocation()).toBe('/');
        expect(getNewContentLocation(content('/site/news', 'News Articles'))).toBe('/site/news/');
        expect(getIdByPath).not.toHaveBeenCalled();
    });

    it('uses parent and cached ancestor tree labels in the given project', () => {
        vi.mocked(getIdByPath).mockReturnValue('ancestor');
        vi.mocked(getContent).mockReturnValue(content('/site/__unnamed__ancestor', 'Draft Folder'));

        expect(getNewContentLocation(content('/__unnamed__parent', 'Parent title'), 'project')).toBe('/Parent title/');
        expect(getNewContentLocation(content('/site/__unnamed__ancestor/__unnamed__parent'), 'project')).toBe(
            '/site/Draft Folder/<Unnamed Folder>/',
        );
        expect(getIdByPath).toHaveBeenCalledWith('/site/__unnamed__ancestor', 'project');
        expect(getContent).toHaveBeenCalledWith('ancestor', 'project');
    });

    it('uses a localized fallback for uncached ancestors without making requests', () => {
        Messages.setMessages({ 'field.unnamed': 'uten navn' });
        const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));

        expect(getNewContentLocation(content('/__unnamed__site/news'), 'project')).toBe('/<uten navn>/news/');
        expect(fetch).not.toHaveBeenCalled();
    });
});
