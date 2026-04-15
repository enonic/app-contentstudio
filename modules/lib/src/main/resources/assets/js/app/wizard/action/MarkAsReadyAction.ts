import {BasePublishAction} from './BasePublishAction';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import type {ContentSummary} from '../../content/ContentSummary';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';

export class MarkAsReadyAction extends BasePublishAction {

    constructor(wizard: ContentWizardPanel) {
        super({
            wizard,
            label: i18n('action.markAsReady'),
            shortcut: 'ctrl+alt+r',
            errorMessage: i18n('notify.publish.invalidError'),
            markAsReady: true,
        });
    }

    protected createPromptEvent(summary: ContentSummary[]): void {
        openPublishDialog(summary);
    }
}
