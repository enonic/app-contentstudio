import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {assert} from 'lib-admin-ui/util/Assert';

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

        let other = <ItemViewId>o;

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
