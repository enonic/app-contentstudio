import {Mixin} from './Mixin';
import {Comparator} from '@enonic/lib-admin-ui/Comparator';

export class MixinByMixinNameComparator
    implements Comparator<Mixin> {

    compare(a: Mixin, b: Mixin): number {
        let firstName: string;
        let secondName: string;

        if (!a.getName()) {
            return 1;
        } else {
            firstName = a.getName().getLocalName();
        }
        if (!b.getName()) {
            return -1;
        } else {
            secondName = b.getName().getLocalName();
        }
        return firstName.localeCompare(secondName);
    }
}
