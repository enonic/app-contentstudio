import {ResponsiveToolbar} from './ResponsiveToolbar';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Button2} from '@enonic/lib-admin-ui/ui2/Button2';

export class ContentBrowseToolbar
    extends ResponsiveToolbar {

    ariaLabel: string = i18n('wcag.contentbrowser.toolbar.label');

    private readonly publishAction: Action;

    constructor(publishAction: Action) {
        super({
            className: 'content-browse-toolbar'
        });

        this.publishAction = publishAction;

        let counter = 0;
        const btn = new Button2({label: '(0)', onClick: () => {
            counter++;
            btn.setProps({label: `(${counter})`});
        }});

        this.prependChild(btn);
    }

    protected processBeforeMobileModeOn() {
        this.addAction(this.publishAction).addClass('publish-action');
    }

    protected processBeforeMobileModeOff() {
        this.removeAction(this.publishAction);
    }
}
