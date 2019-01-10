import PrincipalListJson = api.security.PrincipalListJson;
import PrincipalType = api.security.PrincipalType;
import IdProviderKey = api.security.IdProviderKey;
import {FindAccessControlEntriesRequest} from '../resource/FindAccessControlEntriesRequest';
import {AccessControlEntry} from '../access/AccessControlEntry';

export class AccessControlEntryLoader
    extends api.util.loader.BaseLoader<PrincipalListJson, AccessControlEntry> {

    protected request: FindAccessControlEntriesRequest;

    constructor() {
        super();

        // allow all by default
        this.setAllowedTypes([PrincipalType.GROUP, PrincipalType.USER, PrincipalType.ROLE]);
    }

    protected createRequest(): FindAccessControlEntriesRequest {
        return new FindAccessControlEntriesRequest();
    }

    protected getRequest(): FindAccessControlEntriesRequest {
        return this.request;
    }

    setIdProviderKey(key: IdProviderKey): AccessControlEntryLoader {
        this.getRequest().setIdProviderKey(key);
        return this;
    }

    setAllowedTypes(principalTypes: PrincipalType[]): AccessControlEntryLoader {
        this.getRequest().setAllowedTypes(principalTypes);
        return this;
    }

    search(searchString: string): wemQ.Promise<AccessControlEntry[]> {
        this.getRequest().setSearchQuery(searchString);
        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setSearchQuery(value);
    }

}
