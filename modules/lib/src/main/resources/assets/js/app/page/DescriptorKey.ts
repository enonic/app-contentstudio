import {Equitable} from 'lib-admin-ui/Equitable';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DescriptorName} from './DescriptorName';

export class DescriptorKey
    implements Equitable {

    private static SEPARATOR: string = ':';

    private applicationKey: ApplicationKey;

    private name: DescriptorName;

    private refString: string;

    constructor(applicationKey: ApplicationKey, name: DescriptorName) {
        this.applicationKey = applicationKey;
        this.name = name;
        this.refString = applicationKey.toString() + DescriptorKey.SEPARATOR + name.toString();
    }

    public static fromString(str: string): DescriptorKey {
        let sepIndex: number = str.indexOf(DescriptorKey.SEPARATOR);
        if (sepIndex === -1) {
            throw new Error(`DescriptorKey must contain separator '${DescriptorKey.SEPARATOR}':${str}`);
        }

        let applicationKey = str.substring(0, sepIndex);
        let name = str.substring(sepIndex + 1, str.length);

        return new DescriptorKey(ApplicationKey.fromString(applicationKey), new DescriptorName(name));
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    getName(): DescriptorName {
        return this.name;
    }

    toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, DescriptorKey)) {
            return false;
        }

        let other = <DescriptorKey>o;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }
}
