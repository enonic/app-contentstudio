import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { type ContentWizardPanel } from '../ContentWizardPanel';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { PreviewActionHelper } from '../../action/PreviewActionHelper';
import { BrowserHelper } from '@enonic/lib-admin-ui/BrowserHelper';
import {
    $activeWidget,
    $liveViewWidgets,
    $isLiveViewImageEditorActive,
} from '../../../v6/widgets/inspectors/model/liveViewWidgets.store';

export function getContentWizardPreviewWidget(): Extension | undefined {
    // Automatic displays the image editor; the external preview uses the Media endpoint.
    if ($isLiveViewImageEditorActive.get()) {
        return $liveViewWidgets.get().widgets.find((widget) => widget.getDescriptorKey().getName() === 'preview-media');
    }
    return $activeWidget.get();
}

export class PreviewAction extends Action {
    private writePermissions: boolean = false;

    private wizard: ContentWizardPanel;

    private helper: PreviewActionHelper;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.wizard = wizard;
        this.helper = new PreviewActionHelper();
        this.setEnabled(false);

        this.onExecuted(() => this.handleExecuted());
    }

    protected handleExecuted() {
        const widget = getContentWizardPreviewWidget();
        if (!widget) {
            return;
        }
        if (this.writePermissions && this.wizard.hasUnsavedChanges()) {
            this.wizard.setRequireValid(true);
            this.wizard
                .saveChanges()
                .then((content) => this.helper.openWindow(content, widget))
                .catch((reason) => DefaultErrorHandler.handle(reason))
                .done();
        } else {
            this.helper.openWindow(this.wizard.getPersistedItem(), widget);
        }
    }

    setWritePermissions(writePermissions: boolean) {
        this.writePermissions = writePermissions;
    }
}
