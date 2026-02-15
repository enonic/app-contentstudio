import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import type Q from 'q';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {type Widget} from '@enonic/lib-admin-ui/content/Widget';
import {WidgetsToolbar} from './WidgetsToolbar';

export class WidgetsSidebar
    extends DivEl {

    private readonly fullscreenWidgetsToolbar: WidgetsToolbar;

    constructor() {
        super('sidebar');

        this.fullscreenWidgetsToolbar = new WidgetsToolbar();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.createAppNameBlock());
            this.appendChildren(this.fullscreenWidgetsToolbar);
            this.appendChild(this.createAppVersionBlock());

            return rendered;
        });
    }

    onItemSelected(handler: (appOrWidgetId: string) => void) {
        this.fullscreenWidgetsToolbar.onItemSelected(handler);
    }

    getButtons(): Button[] {
        return this.fullscreenWidgetsToolbar.getButtons();
    }

    addWidget(widget: Widget, buttonClass?: string): void {
        this.fullscreenWidgetsToolbar.addWidget(widget, buttonClass);
    }

    toggleActiveButton() {
        this.fullscreenWidgetsToolbar.toggleActiveButton();
    }

    removeWidget(widget: Widget): void {
        this.fullscreenWidgetsToolbar.removeWidget(widget);
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(Store.instance().get('application').getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }

    private createAppVersionBlock(): DivEl {
        const appVersion: string = CONFIG.getString('appVersion');
        const cleanVersion: string = StringHelper.cleanVersion(appVersion);
        const appVersionSpan: DivEl = new DivEl('app-version');
        appVersionSpan.setHtml(`v${cleanVersion}`);

        if (appVersion !== cleanVersion) {
            appVersionSpan.setTitle(`v${appVersion}`);
        }

        return appVersionSpan;
    }
}
