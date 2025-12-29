import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Reference} from '@enonic/lib-admin-ui/util/Reference';

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

        let other = o as ContentId;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }

    public static fromObject(o: object): ContentId {
        if (o instanceof ContentId) {
            return o;
        } else {
            return new ContentId(o['value']);
        }
    }
}
