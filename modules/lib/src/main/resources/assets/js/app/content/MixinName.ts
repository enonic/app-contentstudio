import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationBasedName} from '@enonic/lib-admin-ui/application/ApplicationBasedName';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';

export class MixinName
    extends ApplicationBasedName {

    constructor(name: string) {
        assertNotNull(name, 'Mixin name can\'t be null');
        let parts = name.split(ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, MixinName)) {
            return false;
        }

        return super.equals(o);
    }
}
