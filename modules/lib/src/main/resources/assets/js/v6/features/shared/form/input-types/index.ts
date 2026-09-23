import { inputTypeRegistry } from '@enonic/input-types';
import { ContentTypeFilterDescriptor, ContentTypeFilterInput } from './content-type-filter';
import { HtmlAreaDescriptor, HtmlAreaInput } from './html-area/';
import { ImageSelectorDescriptor, ImageSelectorInput } from './image-selector';
import { MediaSelectorDescriptor, MediaSelectorInput } from './media-selector';
import { ContentSelectorDescriptor, ContentSelectorInput } from './content-selector';
import { SiteConfiguratorDescriptor, SiteConfiguratorInput } from './site-configurator';
import { AttachmentUploaderDescriptor, AttachmentUploaderInput } from './attachment-uploader';
import { CustomSelectorDescriptor, CustomSelectorInput } from './custom-selector';
import { ImageUploaderDescriptor, ImageUploaderInput } from './image-uploader';
import { MediaUploaderDescriptor, MediaUploaderInput } from './media-uploader';
import { TagDescriptor, TagInput } from './tag';

export function registerContentStudioInputTypes(): void {
    inputTypeRegistry.registerType({ mode: 'list', descriptor: HtmlAreaDescriptor, component: HtmlAreaInput }, true);
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: ImageSelectorDescriptor, component: ImageSelectorInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: MediaSelectorDescriptor, component: MediaSelectorInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: ContentSelectorDescriptor, component: ContentSelectorInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: SiteConfiguratorDescriptor, component: SiteConfiguratorInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: ContentTypeFilterDescriptor, component: ContentTypeFilterInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: AttachmentUploaderDescriptor, component: AttachmentUploaderInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: CustomSelectorDescriptor, component: CustomSelectorInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: ImageUploaderDescriptor, component: ImageUploaderInput },
        true,
    );
    inputTypeRegistry.registerType(
        { mode: 'internal', descriptor: MediaUploaderDescriptor, component: MediaUploaderInput },
        true,
    );
    // Override the built-in Tag input with the Content Studio variant.
    // TagDescriptor is already registered by built-in types, so force=true is intentional.
    inputTypeRegistry.registerType({ mode: 'internal', descriptor: TagDescriptor, component: TagInput }, true);
}
