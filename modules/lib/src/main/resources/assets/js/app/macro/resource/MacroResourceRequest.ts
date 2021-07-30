import {CmsResourceRequest} from 'lib-admin-ui/rest/CmsResourceRequest';

export class MacroResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('macro');
    }

}
