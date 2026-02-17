import type Q from 'q';
import {WizardStepsPanel} from '@enonic/lib-admin-ui/app/wizard/WizardStepsPanel';
import {type PanelStripHeader} from '@enonic/lib-admin-ui/ui/panel/PanelStripHeader';
import {ContentPanelStripHeader} from './ContentPanelStripHeader';
import {type TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {type WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';

export class ContentWizardStepsPanel
    extends WizardStepsPanel {

    protected createHeader(header: string, wizardStepForm: WizardStepForm): PanelStripHeader {
        const isPanelOptional = this.isXDataStepFormOptional(wizardStepForm);
        const panelStripHeader = new ContentPanelStripHeader({text: header, optional: isPanelOptional});

        if (isPanelOptional) {
            panelStripHeader.onEnableChanged((state) => {
                (wizardStepForm as XDataWizardStepForm).setExpandState(state);
            });
        }

        return panelStripHeader;
    }

    insertNavigablePanel(item: TabBarItem, wizardStepForm: WizardStepForm, header: string, index: number, select?: boolean): number {
        if (this.isXDataStepFormOptional(wizardStepForm)) {
            wizardStepForm.onHidden(() => {
                item.hide();
            });

            wizardStepForm.onShown(() => {
                item.show();
            });
        }

        super.insertNavigablePanel(item, wizardStepForm, header, index, select);

        return index;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('content-wizard-steps-panel');

            return rendered;
        });
    }

    private isXDataStepFormOptional(wizardStepForm: WizardStepForm): boolean {
        return wizardStepForm instanceof XDataWizardStepForm && wizardStepForm.isOptional();
    }
}
