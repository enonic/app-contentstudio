import { type Form, type FormItem, Input } from '@enonic/input-types/schema';
import type { FormScope, FormScopeRequirement } from './FormScopeContext';
import {
    ATTACHMENT_UPLOADER_SCOPE_REQUIREMENT,
    AttachmentUploaderDescriptor,
} from './input-types/attachment-uploader/AttachmentUploaderDescriptor';
import {
    CONTENT_SELECTOR_SCOPE_REQUIREMENT,
    ContentSelectorDescriptor,
} from './input-types/content-selector/ContentSelectorDescriptor';
import {
    CONTENT_TYPE_FILTER_SCOPE_REQUIREMENT,
    ContentTypeFilterDescriptor,
} from './input-types/content-type-filter/ContentTypeFilterDescriptor';
import {
    CUSTOM_SELECTOR_SCOPE_REQUIREMENT,
    CustomSelectorDescriptor,
} from './input-types/custom-selector/CustomSelectorDescriptor';
import {
    IMAGE_SELECTOR_SCOPE_REQUIREMENT,
    ImageSelectorDescriptor,
} from './input-types/image-selector/ImageSelectorDescriptor';
import {
    IMAGE_UPLOADER_SCOPE_REQUIREMENT,
    ImageUploaderDescriptor,
} from './input-types/image-uploader/ImageUploaderDescriptor';
import {
    MEDIA_SELECTOR_SCOPE_REQUIREMENT,
    MediaSelectorDescriptor,
} from './input-types/media-selector/MediaSelectorDescriptor';
import {
    MEDIA_UPLOADER_SCOPE_REQUIREMENT,
    MediaUploaderDescriptor,
} from './input-types/media-uploader/MediaUploaderDescriptor';
import {
    SITE_CONFIGURATOR_SCOPE_REQUIREMENT,
    SiteConfiguratorDescriptor,
} from './input-types/site-configurator/SiteConfiguratorDescriptor';

// What each input type needs from the scope, declared next to its descriptor and used by its hook call.
// Imported from the descriptor files, not the folder indexes, which pull in the inputs' UI.
// ? ContentTypeFilter needs the content only in its content-bound mode; counted as project-only.
const SCOPE_REQUIREMENTS: Record<string, FormScopeRequirement> = {
    [AttachmentUploaderDescriptor.name]: ATTACHMENT_UPLOADER_SCOPE_REQUIREMENT,
    [ContentSelectorDescriptor.name]: CONTENT_SELECTOR_SCOPE_REQUIREMENT,
    [ContentTypeFilterDescriptor.name]: CONTENT_TYPE_FILTER_SCOPE_REQUIREMENT,
    [CustomSelectorDescriptor.name]: CUSTOM_SELECTOR_SCOPE_REQUIREMENT,
    [ImageSelectorDescriptor.name]: IMAGE_SELECTOR_SCOPE_REQUIREMENT,
    [ImageUploaderDescriptor.name]: IMAGE_UPLOADER_SCOPE_REQUIREMENT,
    [MediaSelectorDescriptor.name]: MEDIA_SELECTOR_SCOPE_REQUIREMENT,
    [MediaUploaderDescriptor.name]: MEDIA_UPLOADER_SCOPE_REQUIREMENT,
    [SiteConfiguratorDescriptor.name]: SITE_CONFIGURATOR_SCOPE_REQUIREMENT,
};

/**
 * Whether the form has an input the scope disables: one that needs a project or a
 * content item the scope sets to `null`. A key left out falls back to the stores and
 * counts as present. Nested item sets and option sets are searched too.
 */
export const hasScopeDisabledInputs = (form: Form, scope: FormScope): boolean => {
    const missing: FormScopeRequirement = { project: scope.project === null, content: scope.content === null };
    if (!missing.project && !missing.content) return false;

    return hasDisabledInput(form.getFormItems(), missing);
};

// Internal. Walks the items recursively; `missing` flags what the scope lacks.
const hasDisabledInput = (items: readonly FormItem[], missing: FormScopeRequirement): boolean =>
    items.some((item) => {
        if (!(item instanceof Input)) return hasDisabledInput(item.getFormItems(), missing);

        const requirement = SCOPE_REQUIREMENTS[item.getInputType().toString()];
        return Boolean((requirement?.project && missing.project) || (requirement?.content && missing.content));
    });
