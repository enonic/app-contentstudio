import {FindPrincipalsRequest} from '@enonic/lib-admin-ui/security/FindPrincipalsRequest';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {computed, map} from 'nanostores';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {ResultAsync} from 'neverthrow';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from '@enonic/lib-admin-ui/security/GetPrincipalsByKeysRequest';

type PrincipalsStore = {
    principals: Principal[];
    loading: boolean;
};

export const $principals = map<PrincipalsStore>({
    principals: [],
    loading: false,
});

export const userPrincipals = computed($principals, (store) => {
    return store.principals.filter((principal) => principal.getType() === PrincipalType.USER);
});

export const groupPrincipals = computed($principals, (store) => {
    return store.principals.filter((principal) => principal.getType() === PrincipalType.GROUP);
});

export const rolePrincipals = computed($principals, (store) => {
    return store.principals.filter((principal) => principal.getType() === PrincipalType.ROLE);
});

//
// * API
//

export function loadPrincipals(query: string, size: number = 10): void {
    $principals.setKey('loading', true);

    const request = new FindPrincipalsRequest()
        .setPostfixUri(UrlHelper.getCmsRestUri(''))
        .setSearchQuery(query)
        .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP, PrincipalType.ROLE])
        .setSize(size);

    ResultAsync.fromPromise(request.sendAndParse(), (error) => {
        console.error('Failed to load principals:', error);
    }).map((principals) => {
        const seen = new Set<string>();

        const updatedPrincipals = [...$principals.get().principals, ...principals]
            .filter((principal) => {
                const key = principal.getKey().toString();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName()));

        $principals.setKey('principals', updatedPrincipals);
        $principals.setKey('loading', false);
    });
}

export function getPrincipalsByKeys(keys: PrincipalKey[]): ResultAsync<Principal[], Error> {
    const request = new GetPrincipalsByKeysRequest(keys).setPostfixUri(UrlHelper.getCmsRestUri(''));

    return ResultAsync.fromPromise(request.sendAndParse(), (error) => {
        console.error('Failed to load principals by keys:', error);
        return error instanceof Error ? error : new Error(String(error));
    });
}

//
// * Initialization
//

void loadPrincipals('', 50);
