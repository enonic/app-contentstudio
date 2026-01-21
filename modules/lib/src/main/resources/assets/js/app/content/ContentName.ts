import {Name} from '@enonic/lib-admin-ui/Name';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentName
    extends Name
    implements Equitable {

    constructor(name: string) {
        super(name);
    }

    isUnnamed(): boolean {
        return false;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentName)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        return true;
    }

    public static fromString(str: string): ContentName {
        return new ContentName(str);
    }
}
