import { ContentTypeName as LegacyContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { describe, expect, it } from 'vitest';
import { applicationKeyOf, CONTENT_TYPE, isDescendantOfMedia, toContentTypeName } from './contentTypeName';

describe('contentTypeName', () => {
    it('should spell every built-in name the way the legacy class does', () => {
        const legacy = LegacyContentTypeName as unknown as Record<string, LegacyContentTypeName>;

        for (const [key, value] of Object.entries(CONTENT_TYPE)) {
            expect(value, key).toBe(legacy[key].toString());
        }
        expect(CONTENT_TYPE.MEDIA_IMAGE).toBe(LegacyContentTypeName.IMAGE.toString());
    });

    it('should take the application key the way the legacy class does', () => {
        for (const value of ['com.enonic.app.demo:article', 'portal:site']) {
            expect(applicationKeyOf(toContentTypeName(value))).toBe(
                new LegacyContentTypeName(value).getApplicationKey().toString(),
            );
        }
    });

    it('should normalize a string the way the legacy constructor does', () => {
        for (const value of ['com.app:type', 'portal:site', 'a:b:c']) {
            expect(toContentTypeName(value)).toBe(new LegacyContentTypeName(value).toString());
        }
    });

    it('should count only the media:* types as descendants of media', () => {
        const legacyAnswer = (name: string): boolean => new LegacyContentTypeName(name).isDescendantOfMedia();

        for (const name of [...Object.values(CONTENT_TYPE), 'com.app:image', 'media:custom']) {
            expect(isDescendantOfMedia(name), name).toBe(legacyAnswer(name));
        }
        expect(isDescendantOfMedia(CONTENT_TYPE.MEDIA)).toBe(false);
    });
});
