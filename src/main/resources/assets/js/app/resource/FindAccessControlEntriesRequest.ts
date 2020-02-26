import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalListJson} from 'lib-admin-ui/security/PrincipalListJson';
import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {IdProviderKey} from 'lib-admin-ui/security/IdProviderKey';
import {SecurityResourceRequest} from 'lib-admin-ui/security/SecurityResourceRequest';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals');
    }

    sendAndParse(): Q.Promise<AccessControlEntry[]> {
        return this.send().then((response: JsonResponse<PrincipalListJson>) => {
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
