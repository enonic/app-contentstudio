import {TaskResourceRequest} from 'lib-admin-ui/rest/TaskResourceRequest';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';

export class CmsTaskResourceRequest<PARSED_TYPE>
    extends TaskResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return UriHelper.getAdminUri(UriHelper.joinPath('v2', 'rest'));
    }

}
