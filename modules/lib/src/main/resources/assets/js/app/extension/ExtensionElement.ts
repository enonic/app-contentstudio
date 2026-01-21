import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class ExtensionElement extends CustomElement {
    static create<T extends typeof CustomElement>(this: T, tagName: string = 'cs-extension'): InstanceType<T> {
        return super.create(tagName) as InstanceType<T>;
    }
}
