import { Toolbar, type ToolbarConfig } from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Button } from '@enonic/lib-admin-ui/ui2/Button';

type Theme = 'light' | 'dark';

export class ContentBrowseToolbar extends Toolbar<ToolbarConfig> {
    ariaLabel: string = i18n('wcag.contentbrowser.toolbar.label');

    constructor() {
        super({
            className: 'content-browse-toolbar',
        });

        let theme: Theme = 'light';
        const themeSwitcher = new Button({
            label: '☼',
            onClick: () => {
                const toDark = theme === 'light';
                theme = toDark ? 'dark' : 'light';
                const label = toDark ? '☾' : '☼';
                document.documentElement.classList.toggle('dark', toDark);
                themeSwitcher.setProps({ label });
            },
        });

        this.prependChild(themeSwitcher);
    }
}
