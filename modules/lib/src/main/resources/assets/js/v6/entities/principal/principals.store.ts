import { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import { type Principal } from '@enonic/lib-admin-ui/security/Principal';
import { computed, map } from 'nanostores';
import { ResultAsync } from 'neverthrow';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type AppError } from '../../shared/api/errors';
import { findPrincipals, resolvePrincipalsByKeys } from './api/principals.api';

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

    findPrincipals({
        types: [PrincipalType.USER, PrincipalType.GROUP, PrincipalType.ROLE],
        query,
        size,
    })
        .map((principals) => {
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
        })
        .mapErr((error) => {
            console.error('Failed to load principals:', error);
            $principals.setKey('loading', false);
        });
}

export function loadPrincipalsByKeys(keys: PrincipalKey[]): ResultAsync<Principal[], AppError> {
    $principals.setKey('loading', true);

    return getPrincipalsByKeys(keys)
        .map((principals) => {
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

            return principals;
        })
        .mapErr((error) => {
            console.error('Failed to load principals by keys:', error);
            $principals.setKey('loading', false);

            return error;
        });
}

export function getPrincipalsByKeys(keys: PrincipalKey[]): ResultAsync<Principal[], AppError> {
    return resolvePrincipalsByKeys(keys).mapErr((error) => {
        // Some consumers have no error arm; keep the pre-migration logging here.
        console.error('Failed to load principals by keys:', error);
        return error;
    });
}

//
// * Initialization
//

void loadPrincipals('', 50);
