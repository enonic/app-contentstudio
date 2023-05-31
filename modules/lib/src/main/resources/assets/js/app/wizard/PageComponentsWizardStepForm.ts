import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {PageComponentsView} from './PageComponentsView';

export class PageComponentsWizardStepForm
    extends WizardStepForm {

    layout(pcv: PageComponentsView): void {
        this.appendChild(pcv);
    }

}
