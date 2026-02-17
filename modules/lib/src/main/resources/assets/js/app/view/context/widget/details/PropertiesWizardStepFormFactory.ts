import {type PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {SettingsWizardStepForm} from './SettingsWizardStepForm';

export enum PropertiesWizardStepFormType {
    SETTINGS = 'settings',
    SCHEDULE = 'schedule'
}

export class PropertiesWizardStepFormFactory {

    private static cache: Map<PropertiesWizardStepFormType, PropertiesWizardStepForm> =
        new Map<PropertiesWizardStepFormType, PropertiesWizardStepForm>();

    static getWizardStepForm(type: PropertiesWizardStepFormType): PropertiesWizardStepForm {
        if (PropertiesWizardStepFormFactory.cache.has(type)) {
            return PropertiesWizardStepFormFactory.cache.get(type);
        }

        const form: PropertiesWizardStepForm = PropertiesWizardStepFormFactory.createFormByType(type);
        PropertiesWizardStepFormFactory.cache.set(type, form);

        return form;
    }

    private static createFormByType(type: PropertiesWizardStepFormType): PropertiesWizardStepForm {
        if (type === PropertiesWizardStepFormType.SETTINGS) {
            return new SettingsWizardStepForm();
        }

        throw new Error(`Unknown properties form type: ${type}`);
    }
}
