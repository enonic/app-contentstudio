import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {requestFullWizardSave} from '../../../v6/features/store/wizardSave.store';

export class ContentSaveAction
    extends Action {

    private static CLASS_NAME_SAVED: string = 'saved';

    private locked: boolean = false;

    constructor(label: string = i18n('action.save')) {
        super(label, 'mod+s', true);

        this.setEnabled(false);

        this.onExecuted(() => {
            this.setEnabled(false);
            return this.saveChanges();
        });
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

    private saveChanges() {
        this.setLabel(i18n('action.saving'));

        return requestFullWizardSave().then(() => {
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
