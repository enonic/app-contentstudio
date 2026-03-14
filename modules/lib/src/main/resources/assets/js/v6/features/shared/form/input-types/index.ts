import {InputTypeRegistry} from '@enonic/lib-admin-ui/form2';
import {HtmlAreaDescriptor, HtmlAreaInput} from './html-area/';
import {ImageSelectorDescriptor, ImageSelectorInput} from './image-selector';

export function registerContentStudioInputTypes(): void {
    InputTypeRegistry.registerType({mode: 'list', descriptor: HtmlAreaDescriptor, component: HtmlAreaInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: ImageSelectorDescriptor, component: ImageSelectorInput}, true);
}
