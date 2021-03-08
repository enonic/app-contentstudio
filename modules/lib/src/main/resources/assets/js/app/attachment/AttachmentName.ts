import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';

export class AttachmentName
    implements Equitable {

    private fileName: string;

    constructor(fileName: string) {
        this.fileName = fileName;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, AttachmentName)) {
            return false;
        }

        let other = <AttachmentName>o;

        if (!ObjectHelper.stringEquals(this.fileName, other.fileName)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return this.fileName;
    }
}
