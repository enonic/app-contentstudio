import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {AppPanel} from 'lib-admin-ui/app/AppPanel';
import {Application} from 'lib-admin-ui/app/Application';
import * as Q from 'q';
import {Store} from 'lib-admin-ui/store/Store';

export abstract class AppContainer
    extends DivEl {

    protected appBar: AppBar;

    protected appPanel: AppPanel;

    constructor() {
        super('app-container');

        this.initElements();
    }

    private initElements() {
        this.appBar = this.createAppBar(Store.instance().get('application'));
        this.appPanel = this.createAppPanel();
    }

    protected abstract createAppBar(application: Application): AppBar;

    protected abstract createAppPanel(): AppPanel;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('app-container');
            this.appendChild(this.appBar);
            this.appendChild(this.appPanel);

            return rendered;
        });
    }

    hide() {
        super.hide();
        this.appPanel.unbindKeys();
    }

    show() {
        super.show();

        if (!this.appPanel.getPanelShown()) {
            this.appPanel.handleBrowse();
        }

        this.appPanel.bindKeys();
    }
}

