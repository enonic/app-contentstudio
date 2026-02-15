import Q from 'q';
import {type ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {type PropertiesWidgetItemViewValue} from './PropertiesWidgetItemViewValue';
import {type PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {PropertiesWizardStepFormFactory, type PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';

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
