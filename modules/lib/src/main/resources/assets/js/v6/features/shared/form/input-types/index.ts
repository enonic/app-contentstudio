import {InputTypeRegistry} from '@enonic/lib-admin-ui/form2';
import {HtmlAreaDescriptor} from './html-area/HtmlAreaDescriptor';
import {HtmlAreaInput} from './html-area/HtmlAreaInput';

export function registerContentStudioInputTypes(): void {
    InputTypeRegistry.registerType({mode: 'list', descriptor: HtmlAreaDescriptor, component: HtmlAreaInput}, true);
}
