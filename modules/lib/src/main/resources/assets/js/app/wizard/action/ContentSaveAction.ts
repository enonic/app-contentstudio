import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SaveAction} from '@enonic/lib-admin-ui/app/wizard/SaveAction';
import {ContentWizardPanel} from '../ContentWizardPanel';

export class ContentSaveAction
    extends SaveAction {

    private static CLASS_NAME_SAVED: string = 'saved';

    private locked: boolean = false;

    constructor(wizardPanel: ContentWizardPanel, label: string = i18n('action.save')) {
        super(wizardPanel, label);

        this.setEnabled(false);
    }

    isSavedStateEnabled(): boolean {
        return ContentSaveAction.CLASS_NAME_SAVED === this.getIconClass();
    }

    setLocked(value: boolean): void {
        this.locked = value;
    }

    setEnabled(value: boolean): ContentSaveAction {
        if (this.locked) {
            return this;
        }

        return super.setEnabled(value) as ContentSaveAction;
    }

    protected saveChanges(wizardPanel: ContentWizardPanel): Q.Promise<void> {
        this.setLabel(i18n('action.saving'));

        return wizardPanel.saveChanges().then(() => {
            this.setLabel(i18n('action.saved'));

            this.toggleIconClass(ContentSaveAction.CLASS_NAME_SAVED, true);

        }, (reason) => {
            this.setLabel(i18n('action.save'));
            this.setEnabled(true);

            this.toggleIconClass(ContentSaveAction.CLASS_NAME_SAVED, false);

            DefaultErrorHandler.handle(reason);
        });
    }
}
