import {TabbedAppBar} from 'lib-admin-ui/app/bar/TabbedAppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SettingsAppBar
    extends TabbedAppBar {

    private appName: DivEl;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.appName = new DivEl('name-block');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-settings');
            this.appName.setHtml(i18n('app.settings'));
            this.insertChild(this.appName, 0);

            return rendered;
        });
    }
}
