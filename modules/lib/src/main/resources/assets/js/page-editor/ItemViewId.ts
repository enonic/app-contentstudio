import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {assert} from '@enonic/lib-admin-ui/util/Assert';

export class ItemViewId
    implements Equitable {

    static DATA_ATTRIBUTE: string = 'live-edit-id';

    private value: number;

    private refString: string;

    constructor(value: number) {
        assert(value >= 1, i18n('live.view.itemviewid.istooshort'));
        this.value = value;
        this.refString = '' + value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ItemViewId)) {
            return false;
        }

        let other = o as ItemViewId;

        if (!ObjectHelper.numberEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }

    toNumber(): number {
        return this.value;
    }

    toString(): string {
        return this.refString;
    }

    static fromString(s: string) {
        return new ItemViewId(+s);
    }
}
