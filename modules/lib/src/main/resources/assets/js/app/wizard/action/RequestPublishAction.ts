import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RequestContentPublishPromptEvent} from '../../browse/RequestContentPublishPromptEvent';
import {BasePublishAction} from './BasePublishAction';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class RequestPublishAction
    extends BasePublishAction {

    constructor() {
        super({
            label: i18n('action.requestPublish')
        });
    }

    protected createPromptEvent(summary: ContentSummaryAndCompareStatus[]): void {
        new RequestContentPublishPromptEvent(summary).fire();
    }
}
