import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {MacroKey} from '@enonic/lib-admin-ui/macro/MacroKey';
import {MacroResourceRequest} from './MacroResourceRequest';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class PreviewRequest<PARSED_TYPE>
    extends MacroResourceRequest<PARSED_TYPE> {

    protected data: PropertyTree;

    protected macroKey: MacroKey;

    constructor(data: PropertyTree, macroKey: MacroKey) {
        super();
        this.setMethod(HttpMethod.POST);
        this.data = data;
        this.macroKey = macroKey;
    }

    getParams(): object {
        return {
            form: this.data.toJson(),
            macroKey: this.macroKey.getRefString()
        };
    }
}
