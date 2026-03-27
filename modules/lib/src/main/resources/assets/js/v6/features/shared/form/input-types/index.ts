import {InputTypeRegistry} from '@enonic/lib-admin-ui/form2';
import {ContentTypeFilterDescriptor, ContentTypeFilterInput} from './content-type-filter';
import {HtmlAreaDescriptor, HtmlAreaInput} from './html-area/';
import {ImageSelectorDescriptor, ImageSelectorInput} from './image-selector';
import {MediaSelectorDescriptor, MediaSelectorInput} from './media-selector';
import {ContentSelectorDescriptor, ContentSelectorInput} from './content-selector';
import {SiteConfiguratorDescriptor, SiteConfiguratorInput} from './site-configurator';
import {AttachmentUploaderDescriptor, AttachmentUploaderInput} from './attachment-uploader';
import {CustomSelectorDescriptor, CustomSelectorInput} from './custom-selector';

export function registerContentStudioInputTypes(): void {
    InputTypeRegistry.registerType({mode: 'list', descriptor: HtmlAreaDescriptor, component: HtmlAreaInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: ImageSelectorDescriptor, component: ImageSelectorInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: MediaSelectorDescriptor, component: MediaSelectorInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: ContentSelectorDescriptor, component: ContentSelectorInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: SiteConfiguratorDescriptor, component: SiteConfiguratorInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: ContentTypeFilterDescriptor, component: ContentTypeFilterInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: AttachmentUploaderDescriptor, component: AttachmentUploaderInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: CustomSelectorDescriptor, component: CustomSelectorInput}, true);
}
