import {BasePublishAction} from './BasePublishAction';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import type {ContentSummary} from '../../content/ContentSummary';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';

export class PublishTreeAction extends BasePublishAction {
    constructor(wizard: ContentWizardPanel) {
        super({wizard, label: i18n('action.publishTree'), errorMessage: i18n('notify.publish.invalidError')});
        this.setClass('publish-tree');
    }

    protected createPromptEvent(summary: ContentSummary[]): void {
        openPublishDialog(summary, true);
    }
}
