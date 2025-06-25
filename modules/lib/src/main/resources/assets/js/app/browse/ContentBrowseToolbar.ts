import {ResponsiveToolbar} from './ResponsiveToolbar';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Button} from '@enonic/lib-admin-ui/ui2/Button';

type Theme = 'light' | 'dark';

export class ContentBrowseToolbar
    extends ResponsiveToolbar {

    ariaLabel: string = i18n('wcag.contentbrowser.toolbar.label');

    private readonly publishAction: Action;

    constructor(publishAction: Action) {
        super({
            className: 'content-browse-toolbar'
        });

        this.publishAction = publishAction;

        let theme: Theme = 'light';
        const themeSwitcher = new Button({
            label: '☼',
            onClick: () => {
                const toDark = theme === 'light';
                theme = toDark ? 'dark' : 'light';
                const label = toDark ? '☾' : '☼';
                document.documentElement.classList.toggle('dark', toDark);
                themeSwitcher.setProps({label});
            }
        });

        this.prependChild(themeSwitcher);
    }

    protected processBeforeMobileModeOn() {
        this.addAction(this.publishAction).addClass('publish-action');
    }

    protected processBeforeMobileModeOff() {
        this.removeAction(this.publishAction);
    }
}
