import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ContentPublishDialogAction
    extends Action {
    constructor(handler: () => Q.Promise<any> | void, title?: string) {
        super(title || i18n('action.publish'));
        this.setIconClass('publish-action');
        this.onExecuted(handler);
    }
}
