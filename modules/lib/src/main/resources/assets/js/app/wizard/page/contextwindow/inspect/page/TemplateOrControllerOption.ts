import {Equitable} from 'lib-admin-ui/Equitable';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {Descriptor} from '../../../../../page/Descriptor';

export type TemplateOrController = PageTemplate | Descriptor;

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

