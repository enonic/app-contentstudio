import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export class MacroResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('macro');
    }

}
