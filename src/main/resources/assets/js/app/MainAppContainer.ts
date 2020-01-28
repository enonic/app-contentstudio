import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {AppPanel} from 'lib-admin-ui/app/AppPanel';
import {Application} from 'lib-admin-ui/app/Application';
import * as Q from 'q';

export abstract class MainAppContainer
    extends DivEl {

    protected appBar: AppBar;

    protected appPanel: AppPanel<any>;

    protected application: Application;

    constructor(application: Application) {
        super('main');

        this.application = application;
        this.initElements();
    }

    private initElements() {
        this.appBar = this.createAppBar(this.application);
        this.appPanel = this.createAppPanel();
    }

    protected abstract createAppBar(application: Application): AppBar;

    protected abstract createAppPanel(): AppPanel<any>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('main');
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
        this.appPanel.handleBrowse();
        this.appPanel.bindKeys();
    }
}

