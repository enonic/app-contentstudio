import {type StyleJson} from './StylesDescriptor';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum StyleType {
    IMAGE = 'image'
}

export class Style {

    private name: string;
    private label: string;
    private element: string;
    private aspectRatio: string;
    private filter: string;

    constructor(json: StyleJson) {
        this.name = json.name;
        this.label = json.label;
        this.element = json.element;
        this.aspectRatio = json.aspectRatio;
        this.filter = json.filter;
    }

    getName(): string {
        return this.name;
    }

    getLabel(): string {
        return this.label;
    }

    getAspectRatio(): string {
        return this.aspectRatio;
    }

    getFilter(): string {
        return this.filter;
    }

    static getEmpty(element: string): Style {
        return new Style({
            name: 'none',
            label: i18n('dialog.style.none'),
            element: element
        });
    }

    isEmpty(): boolean {
        return this.getName() === 'none';
    }

    isForImage(): boolean {
        return this.element === StyleType.IMAGE.toString();
    }

}
