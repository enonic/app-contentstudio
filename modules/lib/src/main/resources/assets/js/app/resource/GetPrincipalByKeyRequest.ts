import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {SecurityResourceRequest} from '@enonic/lib-admin-ui/security/SecurityResourceRequest';
import {UrlHelper} from '../util/UrlHelper';

export class GetPrincipalByKeyRequest
    extends SecurityResourceRequest<Principal> {

    private includeMemberships: boolean;

    constructor(principalKey: PrincipalKey) {
        super();
        this.includeMemberships = false;
        this.addRequestPathElements('principals', principalKey.toString());
    }

    protected getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }

    setIncludeMemberships(includeMemberships: boolean): GetPrincipalByKeyRequest {
        this.includeMemberships = includeMemberships;
        return this;
    }

    getParams(): object {
        return {
            memberships: this.includeMemberships
        };
    }

    protected parseResponse(response: JsonResponse<PrincipalJson>): Principal {
        return Principal.fromJson(response.getResult());
    }

}
