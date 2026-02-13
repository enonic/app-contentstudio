import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from '@enonic/lib-admin-ui/application/ApplicationBasedName';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';

export class XDataName
    extends ApplicationBasedName {

    constructor(name: string) {
        assertNotNull(name, 'XData name can\'t be null');
        const parts = name.split(ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, XDataName)) {
            return false;
        }

        return super.equals(o);
    }
}
