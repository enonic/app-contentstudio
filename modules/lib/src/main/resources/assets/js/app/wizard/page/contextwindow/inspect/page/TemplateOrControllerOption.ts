import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type PageTemplate} from '../../../../../content/PageTemplate';
import {type Descriptor} from '../../../../../page/Descriptor';

export type TemplateOrController = PageTemplate | Descriptor;

export abstract class TemplateOrControllerOption<DATA extends TemplateOrController>
    implements Equitable {

    private readonly data: DATA;

    constructor(data?: DATA) {
        this.data = data;
    }

    getData(): DATA {
        return this.data;
    }

    isAuto(): boolean {
        return !this.data;
    }

    getKey(): string {
        return this.isAuto() ? '__auto__' : this.data.getKey().toString();
    }

    abstract equals(o: Equitable): boolean;
}

