import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';
import {SecurityResourceRequest} from 'lib-admin-ui/security/SecurityResourceRequest';

export class GetPrincipalByKeyRequest extends SecurityResourceRequest<PrincipalJson, Principal> {

    private principalKey: PrincipalKey;

    private includeMemberships: boolean;

    constructor(principalKey: PrincipalKey) {
        super();
        super.setMethod('GET');
        this.principalKey = principalKey;
        this.includeMemberships = false;
    }

    setIncludeMemberships(includeMemberships: boolean): GetPrincipalByKeyRequest {
        this.includeMemberships = includeMemberships;
        return this;
    }

    getParams(): Object {
        return {
            memberships: this.includeMemberships
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals', this.principalKey.toString());
    }

    sendAndParse(): Q.Promise<Principal> {

        return this.send().then((response: JsonResponse<PrincipalJson>) => {
            return Principal.fromJson(response.getResult());
        });
    }

}
