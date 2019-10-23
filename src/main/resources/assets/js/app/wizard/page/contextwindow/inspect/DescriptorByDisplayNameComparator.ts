import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {Comparator} from 'lib-admin-ui/Comparator';

export class DescriptorByDisplayNameComparator
    implements Comparator<Descriptor> {

    compare(a: Descriptor, b: Descriptor): number {
        let firstName: string;
        let secondName: string;
        if (!a) {
            return 1;
        } else {
            firstName = a.getDisplayName() || '';
        }
        if (!b) {
            return -1;
        } else {
            secondName = b.getDisplayName() || '';
        }
        return firstName.localeCompare(secondName);
    }
}
