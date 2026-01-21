import {type CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';
import {ExtensionElement} from './ExtensionElement';

export class ContextPanelExtensionElement extends ExtensionElement {
    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('context-panel-extension') as InstanceType<T>;
    }
}
