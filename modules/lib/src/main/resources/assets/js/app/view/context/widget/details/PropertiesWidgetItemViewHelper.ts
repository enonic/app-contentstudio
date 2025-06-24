import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {PropertiesWidgetItemViewValue} from './PropertiesWidgetItemViewValue';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {PropertiesWizardStepFormFactory, PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';

export abstract class PropertiesWidgetItemViewHelper {

    protected item: ContentSummaryAndCompareStatus;

    setItem(value: ContentSummaryAndCompareStatus): this {
        this.item = value;
        return this;
    }

    abstract generateProps(): Q.Promise<Map<string, PropertiesWidgetItemViewValue>>;

    getAllowedForms(formTypes: PropertiesWizardStepFormType[]): Q.Promise<PropertiesWizardStepForm[]> {
        const result: PropertiesWizardStepForm[] = [];
        const resultPromises: Q.Promise<void>[] = [];

        formTypes.forEach((formType: PropertiesWizardStepFormType) => {
            const p: Q.Promise<void> = this.isFormAllowed(formType).then((isAllowed: boolean) => {
                if (isAllowed) {
                    result.push(PropertiesWizardStepFormFactory.getWizardStepForm(formType));
                }

                return Q.resolve();
            });

            resultPromises.push(p);
        });

        return Q.all(resultPromises).then(() => {
           return result;
        });
    }

    protected isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        throw new Error('Must be implemented by inheritors');
    }
}
