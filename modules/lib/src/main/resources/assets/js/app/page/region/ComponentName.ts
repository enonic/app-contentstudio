import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {assertNotNull} from 'lib-admin-ui/util/Assert';

export class ComponentName
    implements Equitable {

    private static COUNT_DELIMITER: string = '-';

    private value: string;

    constructor(value: string) {
        assertNotNull(value, 'ComponentName value cannot be null');
        this.value = value;
    }

    public hasCountPostfix(): boolean {

        let countDelimiterIndex = this.value.lastIndexOf(ComponentName.COUNT_DELIMITER);
        return countDelimiterIndex > 0 && countDelimiterIndex <= this.value.length - 2;
    }

    public removeCountPostfix(): ComponentName {

        if (!this.hasCountPostfix()) {
            return this;
        }

        let nameWithoutCountPostfix = this.value.substring(0, this.value.lastIndexOf(ComponentName.COUNT_DELIMITER));
        return new ComponentName(nameWithoutCountPostfix);
    }

    public isDuplicateOf(other: ComponentName): boolean {
        if (this.value === other.value) {
            return true;
        }

        if (!this.hasCountPostfix()) {
            return false;
        }

        let nameWithoutCountPostfix = this.removeCountPostfix();
        return nameWithoutCountPostfix.equals(other);
    }

    public createDuplicate(count: number): ComponentName {

        let newValue = this.value + ComponentName.COUNT_DELIMITER + '' + count;
        return new ComponentName(newValue);
    }

    public toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ComponentName)) {
            return false;
        }

        let other = <ComponentName>o;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }
}
