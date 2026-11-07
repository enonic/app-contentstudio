import { ContentTypeName as LegacyContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ContentTypeName } from './contentTypeName';

export const toLegacyContentTypeName = (name: ContentTypeName): LegacyContentTypeName =>
    new LegacyContentTypeName(name);
