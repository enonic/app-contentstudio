import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';

export class ComponentName
    implements Equitable {

    private static COUNT_DELIMITER: string = '-';

    private value: string;

    constructor(value: string) {
        assertNotNull(value, 'ComponentName value cannot be null');
        this.value = value;
    }

    public hasCountPostfix(): boolean {

        const countDelimiterIndex = this.value.lastIndexOf(ComponentName.COUNT_DELIMITER);
        return countDelimiterIndex > 0 && countDelimiterIndex <= this.value.length - 2;
    }

    public removeCountPostfix(): ComponentName {

        if (!this.hasCountPostfix()) {
            return this;
        }

        const nameWithoutCountPostfix = this.value.substring(0, this.value.lastIndexOf(ComponentName.COUNT_DELIMITER));
        return new ComponentName(nameWithoutCountPostfix);
    }

    public isDuplicateOf(other: ComponentName): boolean {
        if (this.value === other.value) {
            return true;
        }

        if (!this.hasCountPostfix()) {
            return false;
        }

        const nameWithoutCountPostfix = this.removeCountPostfix();
        return nameWithoutCountPostfix.equals(other);
    }

    public createDuplicate(count: number): ComponentName {

        const newValue = this.value + ComponentName.COUNT_DELIMITER + '' + count;
        return new ComponentName(newValue);
    }

    public toString(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ComponentName)) {
            return false;
        }

        const other = o as ComponentName;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }
}
