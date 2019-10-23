import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';

export class RepositoryId
    implements Equitable {

    private static VALID_REPOSITORY_ID_REGEX: RegExp = /([a-zA-Z0-9\-:])([a-zA-Z0-9_\-\.:])*/;
    public static CONTENT_REPO_ID: RepositoryId = new RepositoryId('com.enonic.cms.default');
    private value: string;

    constructor(value: string) {
        if (!RepositoryId.isValidRepositoryId(value)) {
            throw new Error('Invalid repository id: ' + value);
        }
        this.value = value;
    }

    static isValidRepositoryId(id: string): boolean {
        return !StringHelper.isBlank(id) && RepositoryId.VALID_REPOSITORY_ID_REGEX.test(id);
    }

    toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, RepositoryId)) {
            return false;
        }

        let other = <RepositoryId>o;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }
}
