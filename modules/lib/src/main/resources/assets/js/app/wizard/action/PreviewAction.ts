import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {$activeWidget} from '../../../v6/features/store/liveViewWidgets.store';
import {$wizardHasChanges} from '../../../v6/features/store/wizardContent.store';
import {$wizardPersistedContent, saveWizardContent, setWizardRequireValid} from '../../../v6/features/store/wizardSave.store';

export class PreviewAction
    extends Action {

    private writePermissions: boolean = false;

    private helper: PreviewActionHelper;

    constructor() {
        super(i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.helper = new PreviewActionHelper();
        this.setEnabled(false);

        this.onExecuted(() => this.handleExecuted());
    }

    protected handleExecuted() {
        const widget = $activeWidget.get();
        if (this.writePermissions && $wizardHasChanges.get()) {
            setWizardRequireValid(true);
            saveWizardContent().then((context) => this.helper.openWindow(context.content, widget)).catch(
                (reason) => DefaultErrorHandler.handle(reason));
        } else {
            this.helper.openWindow($wizardPersistedContent.get(), widget);
        }
    }

    setWritePermissions(writePermissions: boolean) {
        this.writePermissions = writePermissions;
    }
}
