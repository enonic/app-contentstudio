import {type AccessControlEntry} from '../../../../../app/access/AccessControlEntry';
import {Access} from '../../../../../app/security/Access';
import {type Permission} from '../../../../../app/access/Permission';
import {AccessHelper} from '../../../../../app/security/AccessHelper';

export function accessControlEntriesToPrincipalKeys(accessControlEntries: AccessControlEntry[]): string[] {
    return accessControlEntries.map((item) => item.getPrincipalKey().toString());
}

export function getPrincipalsInCustomAccess(accessControlEntries: AccessControlEntry[]): string[] {
    return accessControlEntries
        .filter((entry) => AccessHelper.getAccessValueFromPermissions(entry.getAllowedPermissions()) === Access.CUSTOM)
        .map((entry) => entry.getPrincipalKey().toString());
}

export function getPrincipalAllowedPermissions(accessControlEntries: AccessControlEntry[], principalKey: string): Permission[] {
    return accessControlEntries.find((item) => item?.getPrincipalKey().toString() === principalKey.toString())?.getAllowedPermissions();
}

export function areAccessControlEntriesEqual(a: AccessControlEntry[], b: AccessControlEntry[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = a.map((entry) => entry.toString()).sort();
    const sortedB = b.map((entry) => entry.toString()).sort();
    return sortedA.every((val, i) => val === sortedB[i]);
}

export function compareAccessControlEntries(
    previous: AccessControlEntry[],
    current: AccessControlEntry[]
): {
    added: AccessControlEntry[];
    modified: AccessControlEntry[];
    removed: AccessControlEntry[];
    unchanged: AccessControlEntry[];
} {
    const previousByKey = new Map(previous.map((entry) => [entry.getPrincipalKey().toString(), entry]));
    const currentByKey = new Map(current.map((entry) => [entry.getPrincipalKey().toString(), entry]));

    const added: AccessControlEntry[] = [];
    const modified: AccessControlEntry[] = [];
    const unchanged: AccessControlEntry[] = [];

    for (const [key, entry] of currentByKey) {
        const prev = previousByKey.get(key);
        if (!prev) {
            added.push(entry);
        } else if (!prev.equals(entry)) {
            modified.push(entry);
        } else {
            unchanged.push(entry);
        }
    }

    const removed = previous.filter((entry) => !currentByKey.has(entry.getPrincipalKey().toString()));

    return {added, modified, removed, unchanged};
}
