import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Reference} from 'lib-admin-ui/util/Reference';

export class ContentId
    implements Equitable {

    private value: string;

    constructor(value: string) {
        if (!ContentId.isValidContentId(value)) {
            throw new Error('Invalid content id: ' + value);
        }
        this.value = value;
    }

    static isValidContentId(id: string): boolean {
        return !StringHelper.isEmpty(id) && !StringHelper.isBlank(id);
    }

    static fromReference(reference: Reference) {
        return new ContentId(reference.getNodeId());
    }

    toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentId)) {
            return false;
        }

        let other = <ContentId>o;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }
}
