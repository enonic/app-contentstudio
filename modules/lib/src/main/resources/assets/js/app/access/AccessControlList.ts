import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {AccessControlEntry} from './AccessControlEntry';
import {AccessControlEntryJson} from './AccessControlEntryJson';
import {PermissionsJson} from './PermissionsJson';

export class AccessControlList
    implements Equitable, Cloneable {

    private entries: { [key: string]: AccessControlEntry };

    constructor(entries?: AccessControlEntry[]) {
        this.entries = {};
        if (entries) {
            this.addAll(entries);
        }
    }

    getEntries(): AccessControlEntry[] {
        let values = [];
        for (let key in this.entries) {
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
        let acl: AccessControlEntryJson[] = [];
        this.getEntries().forEach((entry: AccessControlEntry) => {
            let entryJson = entry.toJson();
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

        let other = <AccessControlList>o;
        return ObjectHelper.arrayEquals(this.getEntries().sort(), other.getEntries().sort());
    }

    clone(): AccessControlList {
        let entries: AccessControlEntry[] = [];
        for (let key in this.entries) {
            if (this.entries.hasOwnProperty(key)) {
                entries.push(this.entries[key].clone());
            }
        }
        return new AccessControlList(entries);
    }

    static fromJson(json: PermissionsJson): AccessControlList {
        let acl = new AccessControlList();
        json.permissions.forEach((entryJson: AccessControlEntryJson) => {
            let entry = AccessControlEntry.fromJson(entryJson);
            acl.add(entry);
        });
        return acl;
    }
}
