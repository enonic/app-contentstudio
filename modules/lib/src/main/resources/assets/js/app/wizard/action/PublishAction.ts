import {BasePublishAction} from './BasePublishAction';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';

export class PublishAction extends BasePublishAction {

    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.publish'),
            shortcut: 'ctrl+alt+p',
            errorMessage: i18n('notify.publish.invalidError')
        });
        this.setClass('publish');
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        openPublishDialog(summary);
    }
}
