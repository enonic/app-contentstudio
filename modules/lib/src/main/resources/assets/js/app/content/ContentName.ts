import {Name} from 'lib-admin-ui/Name';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

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
}
