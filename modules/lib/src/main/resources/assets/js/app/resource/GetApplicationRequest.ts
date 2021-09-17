import {GetApplicationRequest as BaseGetAppRequest} from 'lib-admin-ui/application/GetApplicationRequest';
import {UrlHelper} from '../util/UrlHelper';

export class GetApplicationRequest
    extends BaseGetAppRequest {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
