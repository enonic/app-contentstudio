import { ResultAsync, okAsync } from 'neverthrow';
import { type Principal, type PrincipalKey, type PrincipalType } from '@enonic/ui-types';
import { requestJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
import { getCmsRestUri } from '../../../shared/lib/url/cms';
import { parsePrincipal, type PrincipalJson } from '../../../shared/lib/cms/security/principal';

export type FindPrincipalsParams = {
    types: PrincipalType[];
    query?: string;
    size?: number;
};

type FindPrincipalsResultJson = {
    principals: PrincipalJson[];
    totalSize: number;
};

/**
 * Search principals by type, query and size.
 * Used by: entities/principal/principals.store, features/shared/selectors/principal.
 */
export function findPrincipals(params: FindPrincipalsParams): ResultAsync<Principal[], AppError> {
    const query = new URLSearchParams();
    query.append('types', params.types.map((type) => type.toUpperCase()).join(','));
    if (params.query) {
        query.append('query', params.query);
    }
    if (params.size != null) {
        query.append('size', String(params.size));
    }

    const url = `${getCmsRestUri('security/principals')}?${query.toString()}`;

    return requestJson<FindPrincipalsResultJson>(url).map((json) => json.principals.map(parsePrincipal));
}

/**
 * Resolve principals by their keys.
 * Used by: entities/principal/principals.store, features/shared/selectors/principal, features/issues.
 */
export function resolvePrincipalsByKeys(keys: PrincipalKey[]): ResultAsync<Principal[], AppError> {
    if (keys.length === 0) {
        return okAsync([]);
    }

    const url = getCmsRestUri('security/principals/resolveByKeys');

    const payload = {
        keys,
        memberships: false,
    };

    return requestJson<PrincipalJson[]>(url, { method: 'POST', body: payload }).map((json) => json.map(parsePrincipal));
}
