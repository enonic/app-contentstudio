import { createInputTypeRegistry, type InputTypeRegistry, inputTypeRegistry, validateForm } from '@enonic/input-types';
import type { PropertySet } from '@enonic/input-types/data';
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

// The input types whose add flow lists the content types creatable at the form's scope.
const CREATABLE_TYPE_INPUT_TYPES: ReadonlySet<string> = new Set([ContentSelectorDescriptor.name]);

/**
 * Whether the form has an input the scope disables: one that needs a project or a
 * content item the scope sets to `null`. A key left out falls back to the stores and
 * counts as present. Nested item sets and option sets are searched too.
 */
export const hasScopeDisabledInputs = (form: Form, scope: FormScope): boolean => {
    const disabled = getScopeDisabledTypes(scope);
    return disabled.size > 0 && hasInputOfType(form.getFormItems(), disabled);
};

/** Whether the form has an input that offers creatable content types, anywhere in its nesting. */
export const hasCreatableTypeInputs = (form: Form): boolean =>
    hasInputOfType(form.getFormItems(), CREATABLE_TYPE_INPUT_TYPES);

/**
 * Whether the set is valid for what the scope lets the user fill: an input the scope disables
 * does not count, as the user cannot fill it. Validated against a copy of the registry without
 * those types, which the toolkit validates as fine.
 */
export const isFormValidInScope = (form: Form, propertySet: PropertySet, scope: FormScope): boolean => {
    const disabled = getScopeDisabledTypes(scope);
    const registry = disabled.size > 0 ? getRegistryWithout(disabled) : undefined;
    return validateForm(form, propertySet, { registry }).isValid;
};

// *
// * Internal
// *

// The input types the scope disables, by name.
const getScopeDisabledTypes = (scope: FormScope): ReadonlySet<string> => {
    const missing: FormScopeRequirement = { project: scope.project === null, content: scope.content === null };
    const names = Object.entries(SCOPE_REQUIREMENTS)
        .filter(
            ([, requirement]) => (requirement.project && missing.project) || (requirement.content && missing.content),
        )
        .map(([name]) => name);
    return new Set(names);
};

// Walks the items recursively for an input of one of the given types.
const hasInputOfType = (items: readonly FormItem[], types: ReadonlySet<string>): boolean =>
    items.some((item) =>
        item instanceof Input ? types.has(item.getInputType().toString()) : hasInputOfType(item.getFormItems(), types),
    );

// The shared registry without the given types.
const getRegistryWithout = (types: ReadonlySet<string>): InputTypeRegistry => {
    const registry = createInputTypeRegistry();
    inputTypeRegistry.getAll().forEach((definition) => {
        if (!types.has(definition.descriptor.name)) registry.registerType(definition);
    });
    return registry;
};
