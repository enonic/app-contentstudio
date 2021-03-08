import {Equitable} from 'lib-admin-ui/Equitable';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';

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

