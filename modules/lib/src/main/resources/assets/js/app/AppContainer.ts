import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AppPanel} from '@enonic/lib-admin-ui/app/AppPanel';
import Q from 'q';

export abstract class AppContainer
    extends DivEl {

    protected appPanel: AppPanel;

    protected constructor(className?: string) {
        super(`app-container ${className || ''}`);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.appPanel = this.createAppPanel();
    }

    protected initListeners(): void {
        this.onAdded(() => {
            if (this.isVisible()) {
                this.show();
            }

            this.getParentElement().onShown(() => {
                this.show(); // need to toggle key bindings
            });

            this.getParentElement().onHidden(() => {
                this.hide(); // need to toggle key bindings
            });
        });
    }

    protected abstract createAppPanel(): AppPanel;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendElements();

            return rendered;
        });
    }

    protected appendElements(): void {
        this.appendChildren(this.appPanel);
    }

    hide() {
        super.hide();
        this.appPanel?.unbindKeys();
    }

    show() {
        super.show();

        if (this.appPanel && !this.appPanel.getPanelShown()) {
            this.appPanel.handleBrowse();
        }

        this.appPanel?.bindKeys();
    }
}

