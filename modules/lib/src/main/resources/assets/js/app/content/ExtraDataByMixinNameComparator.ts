import {type ExtraData} from './ExtraData';
import {type Comparator} from '@enonic/lib-admin-ui/Comparator';

export class ExtraDataByMixinNameComparator
    implements Comparator<ExtraData> {

    compare(a: ExtraData, b: ExtraData): number {
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
