import { ResultAsync, okAsync } from 'neverthrow';
import { type FindPrincipalsResultJson } from '@enonic/lib-admin-ui/security/FindPrincipalsResultJson';
import { Principal } from '@enonic/lib-admin-ui/security/Principal';
import { type PrincipalJson } from '@enonic/lib-admin-ui/security/PrincipalJson';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

export type FindPrincipalsParams = {
    types: PrincipalType[];
    query?: string;
    size?: number;
};

/**
 * Search principals by type, query and size.
 * Used by: entities/principal/principals.store, features/shared/selectors/assignee.
 */
export function findPrincipals(params: FindPrincipalsParams): ResultAsync<Principal[], AppError> {
    const query = new URLSearchParams();
    query.append('types', params.types.map((type) => PrincipalType[type].toUpperCase()).join(','));
    if (params.query) {
        query.append('query', params.query);
    }
    if (params.size != null) {
        query.append('size', String(params.size));
    }

    const url = `${getCmsRestUri('security/principals')}?${query.toString()}`;

    return requestJson<FindPrincipalsResultJson>(url).map((json) => json.principals.map(Principal.fromJson));
}

/**
 * Resolve principals by their keys.
 * Used by: entities/principal/principals.store, features/shared/selectors/assignee, features/issues.
 */
export function resolvePrincipalsByKeys(keys: PrincipalKey[]): ResultAsync<Principal[], AppError> {
    if (keys.length === 0) {
        return okAsync([]);
    }

    const url = getCmsRestUri('security/principals/resolveByKeys');

    const payload = {
        keys: keys.map((key) => key.toString()),
        memberships: false,
    };

    return requestJson<PrincipalJson[]>(url, { method: 'POST', body: payload }).map((json) =>
        json.map(Principal.fromJson),
    );
}
