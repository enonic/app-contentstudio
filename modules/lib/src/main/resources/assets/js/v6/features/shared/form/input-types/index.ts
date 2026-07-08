import { InputTypeRegistry } from '@enonic/lib-admin-ui/form2';
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
    InputTypeRegistry.registerType({ mode: 'list', descriptor: HtmlAreaDescriptor, component: HtmlAreaInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: ImageSelectorDescriptor, component: ImageSelectorInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: MediaSelectorDescriptor, component: MediaSelectorInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: ContentSelectorDescriptor, component: ContentSelectorInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: SiteConfiguratorDescriptor, component: SiteConfiguratorInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: ContentTypeFilterDescriptor, component: ContentTypeFilterInput }, true);
    InputTypeRegistry.registerType(
        { mode: 'internal', descriptor: AttachmentUploaderDescriptor, component: AttachmentUploaderInput },
        true
    );
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: CustomSelectorDescriptor, component: CustomSelectorInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: ImageUploaderDescriptor, component: ImageUploaderInput }, true);
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: MediaUploaderDescriptor, component: MediaUploaderInput }, true);
    // Override the built-in Tag input with the Content Studio variant.
    // TagDescriptor is already registered by built-in types, so force=true is intentional.
    InputTypeRegistry.registerType({ mode: 'internal', descriptor: TagDescriptor, component: TagInput }, true);
}
