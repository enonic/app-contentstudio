import {Checkbox, CheckboxBuilder} from 'lib-admin-ui/ui/Checkbox';
import {CompareStatus} from '../../content/CompareStatus';

export class CompareStatusCheckbox extends Checkbox {

    private status: CompareStatus;

    constructor(builder: CompareStatusCheckboxBuilder) {
        super(builder);

        this.status = builder.status;
    }

    getStatus(): CompareStatus {
        return this.status;
    }
}

export class CompareStatusCheckboxBuilder extends CheckboxBuilder {

    status: CompareStatus;

    setStatus(value: CompareStatus): CompareStatusCheckboxBuilder {
        this.status = value;

        return this;
    }

    build(): CompareStatusCheckbox {
        return new CompareStatusCheckbox(this);
    }
}
