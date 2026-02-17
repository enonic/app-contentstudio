import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';

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

        const other = o as AttachmentName;

        if (!ObjectHelper.stringEquals(this.fileName, other.fileName)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return this.fileName;
    }
}
