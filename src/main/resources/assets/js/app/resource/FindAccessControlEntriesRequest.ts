import Principal = api.security.Principal;
import PrincipalListJson = api.security.PrincipalListJson;
import PrincipalJson = api.security.PrincipalJson;
import PrincipalType = api.security.PrincipalType;
import IdProviderKey = api.security.IdProviderKey;
import SecurityResourceRequest = api.security.SecurityResourceRequest;
import {AccessControlEntry} from '../access/AccessControlEntry';

export class FindAccessControlEntriesRequest
    extends SecurityResourceRequest<PrincipalListJson, AccessControlEntry[]> {

    private allowedTypes: PrincipalType[];
    private searchQuery: string;
    private idProviderKey: IdProviderKey;

    constructor() {
        super();
    }

    getParams(): Object {
        return {
            types: this.enumToStrings(this.allowedTypes),
            query: this.searchQuery,
            idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : undefined
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'principals');
    }

    sendAndParse(): wemQ.Promise<AccessControlEntry[]> {
        return this.send().then((response: api.rest.JsonResponse<PrincipalListJson>) => {
            return response.getResult().principals.map((principalJson: PrincipalJson) => {
                return new AccessControlEntry(Principal.fromJson(principalJson));
            });
        });
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
}
