type Constructor = abstract new (...args: never[]) => unknown;

/**
 * Cross-context `instanceof` check. Compares constructor names up the
 * prototype chain so it works when the class constructor originates from
 * a different module instance (e.g. `.xp/dev/` linked lib-admin-ui).
 */
export function instanceOf<T extends Constructor>(obj: unknown, type: T): obj is InstanceType<T> {
    if (obj == null || typeof obj !== 'object') {
        return false;
    }

    if (obj instanceof type) {
        return true;
    }

    const targetName = type.name;
    let proto: object | null = obj;

    while ((proto = Object.getPrototypeOf(proto)) !== null) {
        if (proto.constructor.name === targetName) {
            return true;
        }
    }

    return false;
}
