import Q from 'q';
import {type Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {type PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {type ContentInputTypeViewContext} from '../ContentInputTypeViewContext';

/**
 * Legacy stub kept only to satisfy InputTypeManager lookup from the old form system (FormView/InputView).
 * The real UI is handled by the v6 SiteConfiguratorInput registered in InputTypeRegistry.
 */
export class SiteConfigurator
    extends BaseInputTypeManagingAdd {

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'application-configurator');
        this.hide();
    }

    createDefaultValue(_rawValue: unknown): Value {
        return this.getValueType().newNullValue();
    }

    getValueType(): ValueType {
        return ValueTypes.DATA;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.setLayoutInProgress(false);
        });
    }

    update(_propertyArray: PropertyArray, _unchangedOnly?: boolean): Q.Promise<void> {
        return Q();
    }

    reset() {
        // noop
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray()?.getSize() ?? 0;
    }

    giveFocus(): boolean {
        return false;
    }

    isValidationErrorToBeRendered(): boolean {
        return false;
    }
}

InputTypeManager.register(new Class('SiteConfigurator', SiteConfigurator));
