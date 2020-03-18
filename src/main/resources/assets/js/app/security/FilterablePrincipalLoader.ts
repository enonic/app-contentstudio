import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {FindPrincipalListRequest} from 'lib-admin-ui/security/FindPrincipalListRequest';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';

export class FilterablePrincipalLoader extends PrincipalLoader {

    private static PROJECT_ROLE_PREFIX: string = 'cms.project.';

    private forbiddenPrincipals: { [key: string]: PrincipalKey; } = {};

    constructor() {
        super();
    }

    resetForbiddenPrincipals(): FilterablePrincipalLoader {
        this.forbiddenPrincipals = {};

        return this;
    }

    skipPrincipals(principalKeys: PrincipalKey[]): FilterablePrincipalLoader {
        principalKeys.forEach((principalKey: PrincipalKey) => {
            this.forbiddenPrincipals[principalKey.toString()] = principalKey;
        });

        return this;
    }

    skipPrincipal(principalKey: PrincipalKey): FilterablePrincipalLoader {
        this.forbiddenPrincipals[principalKey.toString()] = principalKey;

        return this;
    }

    protected createRequest(): FindPrincipalListRequest {
        const request: FindPrincipalListRequest = new FindPrincipalListRequest().setSize(10);
        request.setResultFilter(this.isAllowedPrincipal.bind(this));

        return request;
    }

    private isAllowedPrincipal(principal: Principal): boolean {
        const principalKey: PrincipalKey = principal.getKey();

        if (this.forbiddenPrincipals[principalKey.toString()]) {
            return false;
        }

        if (principalKey.isRole() && principalKey.getId().indexOf(FilterablePrincipalLoader.PROJECT_ROLE_PREFIX) === 0) {
            return false;
        }

        return true;
    }
}
