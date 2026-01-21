import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class Extension extends CustomElement {
    static create(tagName: string = 'cs-extension'): Extension {
        return CustomElement.create(tagName);
    }
}
