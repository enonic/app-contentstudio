import {TaskResourceRequest} from 'lib-admin-ui/rest/TaskResourceRequest';
import {UrlHelper} from '../util/UrlHelper';

export class CmsTaskResourceRequest<PARSED_TYPE>
    extends TaskResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }

}
