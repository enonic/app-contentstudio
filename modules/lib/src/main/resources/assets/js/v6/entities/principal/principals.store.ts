import { type Principal, type PrincipalKey } from '@enonic/ui-types';
import { computed, map } from 'nanostores';
import { ResultAsync } from 'neverthrow';
import type { AppError } from '@enonic/ui-utils';
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
    return store.principals.filter((principal) => principal.type === 'user');
});

export const groupPrincipals = computed($principals, (store) => {
    return store.principals.filter((principal) => principal.type === 'group');
});

export const rolePrincipals = computed($principals, (store) => {
    return store.principals.filter((principal) => principal.type === 'role');
});

//
// * API
//

export function loadPrincipals(query: string, size: number = 10): void {
    $principals.setKey('loading', true);

    findPrincipals({
        types: ['user', 'group', 'role'],
        query,
        size,
    })
        .map((principals) => {
            const seen = new Set<string>();

            const updatedPrincipals = [...$principals.get().principals, ...principals]
                .filter((principal) => {
                    const key = principal.key;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

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
                    const key = principal.key;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

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

let initialized = false;

export function initPrincipals(): void {
    if (initialized) {
        return;
    }
    initialized = true;

    loadPrincipals('', 50);
}
