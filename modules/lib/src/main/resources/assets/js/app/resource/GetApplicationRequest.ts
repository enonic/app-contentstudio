import {GetApplicationRequest as LibGetAppRequest} from 'lib-admin-ui/application/GetApplicationRequest';
import {UrlHelper} from '../util/UrlHelper';

export class GetApplicationRequest
    extends LibGetAppRequest {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
