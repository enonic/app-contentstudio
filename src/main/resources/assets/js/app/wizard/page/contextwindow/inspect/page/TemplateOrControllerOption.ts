import {PageTemplate} from '../../../../../content/PageTemplate';
import PageDescriptor = api.content.page.PageDescriptor;
import Equitable = api.Equitable;

export type TemplateOrController = PageTemplate | PageDescriptor;

export abstract class TemplateOrControllerOption<DATA extends TemplateOrController>
    implements Equitable {

    private data: DATA;

    constructor(data?: DATA) {
        this.data = data;
    }

    getData(): DATA {
        return this.data;
    }

    isAuto(): boolean {
        return !this.data;
    }

    abstract equals(o: Equitable): boolean;
}

