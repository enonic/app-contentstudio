import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {UrlHelper} from '../util/UrlHelper';

export class ContentPrincipalLoader
    extends PrincipalLoader {

    constructor() {
        super();
        this.setListUri(UrlHelper.getCmsRestUri('security/principals'));
        this.setGetUri(UrlHelper.getCmsRestUri('security/principals/resolveByKeys'));
    }
}
