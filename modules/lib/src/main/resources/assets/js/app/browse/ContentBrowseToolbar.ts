import {ResponsiveToolbar} from './ResponsiveToolbar';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ContentBrowseToolbar
    extends ResponsiveToolbar {

    private readonly publishAction: Action;

    constructor(publishAction: Action) {
        super({
            className: 'content-browse-toolbar'
        });

        this.publishAction = publishAction;
    }

    protected processBeforeMobileModeOn() {
        this.addAction(this.publishAction).addClass('publish-action');
    }

    protected processBeforeMobileModeOff() {
        this.removeAction(this.publishAction);
    }
}
