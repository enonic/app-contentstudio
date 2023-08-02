import {CmsProjectBasedResourceRequest} from '../../wizard/CmsProjectBasedResourceRequest';

export class MacroResourceRequest<PARSED_TYPE>
    extends CmsProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('macro');
    }

}
