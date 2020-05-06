import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalListJson} from 'lib-admin-ui/security/PrincipalListJson';
import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {IdProviderKey} from 'lib-admin-ui/security/IdProviderKey';
import {SecurityResourceRequest} from 'lib-admin-ui/security/SecurityResourceRequest';
import {AccessControlEntry} from '../access/AccessControlEntry';

export class FindAccessControlEntriesRequest
    extends SecurityResourceRequest<AccessControlEntry[]> {

    private allowedTypes: PrincipalType[];
    private searchQuery: string;
    private idProviderKey: IdProviderKey;

    constructor() {
        super();
        this.addRequestPathElements('principals');
    }

    getParams(): Object {
        return {
            types: this.enumToStrings(this.allowedTypes),
            query: this.searchQuery,
            idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : undefined
        };
    }

    private enumToStrings(types: PrincipalType[]): string[] {
        return types.map((type: PrincipalType) => {
            return PrincipalType[type].toUpperCase();
        });
    }

    setIdProviderKey(key: IdProviderKey): FindAccessControlEntriesRequest {
        this.idProviderKey = key;
        return this;
    }

    setAllowedTypes(types: PrincipalType[]): FindAccessControlEntriesRequest {
        this.allowedTypes = types;
        return this;
    }

    setSearchQuery(query: string): FindAccessControlEntriesRequest {
        this.searchQuery = query;
        return this;
    }

    protected parseResponse(response: JsonResponse<PrincipalListJson>): AccessControlEntry[] {
        return response.getResult().principals.map((principalJson: PrincipalJson) => {
            return new AccessControlEntry(Principal.fromJson(principalJson));
        });
    }
}
