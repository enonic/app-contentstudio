import {ResponsiveToolbar} from './ResponsiveToolbar';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ContentBrowseToolbar
    extends ResponsiveToolbar {

    ariaLabel: string = i18n('wcag.contentbrowser.toolbar.label');

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
