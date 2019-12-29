import * as Q from 'q';
import {SettingsItemWizardActions} from './action/SettingsItemWizardActions';
import {WizardPanel, WizardPanelParams} from 'lib-admin-ui/app/wizard/WizardPanel';
import {SettingsItem} from '../data/SettingsItem';
import {Action} from 'lib-admin-ui/ui/Action';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';
import {WizardStep} from 'lib-admin-ui/app/wizard/WizardStep';
import {i18n} from 'lib-admin-ui/util/Messages';
import {
    WizardHeaderWithDisplayNameAndName,
    WizardHeaderWithDisplayNameAndNameBuilder
} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {FormIcon} from 'lib-admin-ui/app/wizard/FormIcon';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {SettingItemWizardStepForm} from './SettingItemWizardStepForm';

export abstract class SettingsItemWizardPanel<T extends SettingsItem>
    extends WizardPanel<T> {

    protected wizardActions: SettingsItemWizardActions;

    private wizardStepForm: SettingItemWizardStepForm;

    constructor(params: WizardPanelParams<T>) {
        super(params);

        this.loadData();
        ResponsiveManager.onAvailableSizeChanged(this);
    }

    protected createWizardActions(): SettingsItemWizardActions {
        return new SettingsItemWizardActions(this);
    }

    protected createMainToolbar(): Toolbar {
        const toolbar: Toolbar = new Toolbar();

        toolbar.addAction(this.wizardActions.getSaveAction());
        toolbar.addAction(this.wizardActions.getDeleteAction());

        return toolbar;
    }

    protected createFormIcon(): FormIcon {
        const iconUrl: string = ImgEl.PLACEHOLDER;
        const formIcon: FormIcon = new FormIcon(iconUrl, 'icon');
        formIcon.addClass('icon icon-xlarge');
        formIcon.addClass(this.getIconClass());

        return formIcon;
    }

    protected abstract getIconClass(): string;

    protected doLoadData(): Q.Promise<T> {
        if (!this.getPersistedItem()) {
            return Q(null);
        } else {
            return Q(this.getPersistedItem());
        }
    }

    private createSteps(): WizardStep[] {
        const steps: WizardStep[] = [];

        this.wizardStepForm = this.createWizardStepForm();

        steps.push(new WizardStep(i18n('settings.items.type.project'), this.wizardStepForm));

        return steps;
    }

    protected abstract createWizardStepForm(): SettingItemWizardStepForm;

    doLayout(persistedItem: T): Q.Promise<void> {

        this.setSteps(this.createSteps());

        if (!!persistedItem) {
            this.wizardStepForm.layout(persistedItem);
        }

        return Q<void>(null);
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        let wizardHeader = new WizardHeaderWithDisplayNameAndNameBuilder().build();

        const existing = this.getPersistedItem();
        const name = this.getWizardNameValue();

        let displayName = '';

        if (existing) {
            displayName = existing.getDisplayName();

            wizardHeader.disableNameInput();
            wizardHeader.setAutoGenerationEnabled(false);
        }

        wizardHeader.setPath('');
        wizardHeader.initNames(displayName, name, false);

        return wizardHeader;
    }

    protected getWizardNameValue(): string {
        return this.getPersistedItem() ? this.getPersistedItem().getId() : '';
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-item-wizard-panel');

            return rendered;
        });
    }

    getCloseAction(): Action {
        return (<SettingsItemWizardActions>this.wizardActions).getCloseAction();
    }
}
