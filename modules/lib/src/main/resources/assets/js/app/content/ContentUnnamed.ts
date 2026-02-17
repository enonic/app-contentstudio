import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentName} from './ContentName';
import {assert} from '@enonic/lib-admin-ui/util/Assert';

export class ContentUnnamed
    extends ContentName
    implements Equitable {

    public static UNNAMED_PREFIX: string = '__unnamed__';

    constructor(name: string) {
        super(name);
        assert(name.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0,
            'An UnnamedContent must start with [' + ContentUnnamed.UNNAMED_PREFIX + ']: ' + name);
    }

    public static newUnnamed() {
        return new ContentUnnamed(ContentUnnamed.UNNAMED_PREFIX);
    }

    isUnnamed(): boolean {
        return true;
    }

    toString(): string {
        return '';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentUnnamed)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        return true;
    }
}
