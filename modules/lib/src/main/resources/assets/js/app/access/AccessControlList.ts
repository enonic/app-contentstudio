import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {AccessControlEntry} from './AccessControlEntry';
import {type AccessControlEntryJson} from './AccessControlEntryJson';
import {type PermissionsJson} from './PermissionsJson';

export class AccessControlList
    implements Equitable, Cloneable {

    private entries: Record<string, AccessControlEntry>;

    constructor(entries?: AccessControlEntry[]) {
        this.entries = {};
        if (entries) {
            this.addAll(entries);
        }
    }

    getEntries(): AccessControlEntry[] {
        const values = [];
        for (const key in this.entries) {
            if (this.entries.hasOwnProperty(key)) {
                values.push(this.entries[key]);
            }
        }
        return values;
    }

    getEntry(principalKey: PrincipalKey): AccessControlEntry {
        return this.entries[principalKey.toString()];
    }

    add(entry: AccessControlEntry): void {
        this.entries[entry.getPrincipalKey().toString()] = entry;
    }

    addAll(entries: AccessControlEntry[]): void {
        entries.forEach((entry) => {
            this.entries[entry.getPrincipalKey().toString()] = entry;
        });
    }

    contains(principalKey: PrincipalKey): boolean {
        return this.entries.hasOwnProperty(principalKey.toString());
    }

    remove(principalKey: PrincipalKey): void {
        delete this.entries[principalKey.toString()];
    }

    toJson(): AccessControlEntryJson[] {
        const acl: AccessControlEntryJson[] = [];
        this.getEntries().forEach((entry: AccessControlEntry) => {
            const entryJson = entry.toJson();
            acl.push(entryJson);
        });
        return acl;
    }

    toString(): string {
        return '[' + this.getEntries().map((ace) => ace.toString()).join(', ') + ']';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, AccessControlList)) {
            return false;
        }

        const other = o as AccessControlList;
        return ObjectHelper.arrayEquals(this.getEntries().sort(), other.getEntries().sort());
    }

    clone(): AccessControlList {
        const entries: AccessControlEntry[] = [];
        for (const key in this.entries) {
            if (this.entries.hasOwnProperty(key)) {
                entries.push(this.entries[key].clone());
            }
        }
        return new AccessControlList(entries);
    }

    static fromJson(json: PermissionsJson): AccessControlList {
        const acl = new AccessControlList();
        json.permissions.forEach((entryJson: AccessControlEntryJson) => {
            const entry = AccessControlEntry.fromJson(entryJson);
            acl.add(entry);
        });
        return acl;
    }
}
