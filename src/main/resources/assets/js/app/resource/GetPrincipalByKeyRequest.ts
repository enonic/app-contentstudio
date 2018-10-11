import Principal = api.security.Principal;
import PrincipalKey = api.security.PrincipalKey;
import PrincipalJson = api.security.PrincipalJson;
import SecurityResourceRequest = api.security.SecurityResourceRequest;

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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'principals', this.principalKey.toString());
    }

    sendAndParse(): wemQ.Promise<Principal> {

        return this.send().then((response: api.rest.JsonResponse<PrincipalJson>) => {
            return this.fromJsonToPrincipal(response.getResult());
        });
    }

}
