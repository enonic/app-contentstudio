import {CmsResourceRequest} from '../../resource/CmsResourceRequest';

export class MacroResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('macro');
    }

}
