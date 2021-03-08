import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from 'lib-admin-ui/application/ApplicationBasedName';
import {assertNotNull} from 'lib-admin-ui/util/Assert';

export class XDataName
    extends ApplicationBasedName {

    constructor(name: string) {
        assertNotNull(name, `XData name can't be null`);
        let parts = name.split(ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, XDataName)) {
            return false;
        }

        return super.equals(o);
    }
}
