import {TabbedAppBar} from 'lib-admin-ui/app/bar/TabbedAppBar';
import {Application} from 'lib-admin-ui/app/Application';
import Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SettingsAppBar
    extends TabbedAppBar {

    constructor(application: Application) {
        super(application);

        this.setHomeIconAction();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-settings');
            this.setAppName(i18n('app.settings'));
            this.getAppIcon().addClass('icon-cog');

            return rendered;
        });
    }
}
