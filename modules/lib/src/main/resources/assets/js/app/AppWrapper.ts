import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import Q from 'q';
import {Element, NewElementBuilder} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {WidgetElement, WidgetHelper} from '@enonic/lib-admin-ui/widget/WidgetHelper';
import {ContentAppContainer} from './ContentAppContainer';
import {Router} from './Router';
import {UrlAction} from './UrlAction';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {cn} from '@enonic/ui';
import {SidebarElement} from '../v6/features/layout/AppShell/Sidebar';
import {$activeWidget, isDefaultWidget} from '../v6/features/store/sidebarWidgets.store';
import {AppBarElement} from '../v6/features/layout/AppShell/AppBar';

export class AppWrapper extends DivEl {
    private sidebar: SidebarElement;

    private widgetElements: Map<string, WidgetElement> = new Map<string, WidgetElement>();

    private activeWidgets: string[] = [];

    private appBar: AppBarElement;

    private widgetsBlock: DivEl;

    constructor(className?: string) {
        super(cn('main-app-wrapper text-main', className));

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.sidebar = new SidebarElement();
        this.appBar = AppBarElement.getInstance();
        this.widgetsBlock = new DivEl('widgets-block');
    }

    private initListeners() {
        $activeWidget.subscribe((value) => {
            if (value) this.selectWidget(value);
        });
    }

    private createStudioWidgetEl(): Element {
        const widgetEl: Element = new Element(new NewElementBuilder().setTagName('widget')).setId('widget-studio');
        const appContainer: ContentAppContainer = new ContentAppContainer();

        appContainer.onShown(() => {
            this.appBar.showIssuesButton();
        });

        appContainer.onHidden(() => {
            this.appBar.hideIssuesButton();
        });

        widgetEl.appendChild(appContainer);

        return widgetEl;
    }

    selectWidget(widget: Readonly<Widget>) {
        const widgetToSelectKey: string = widget.getWidgetDescriptorKey().toString();
        this.widgetElements.forEach((widgetEl: WidgetElement, key: string) => {
            if (key !== widgetToSelectKey) {
                this.setWidgetActive(key, widgetEl, false);
            }
        });
        this.updateUrl(widget);
        this.updateTabName(widget);

        if (this.widgetElements.has(widgetToSelectKey)) {
            this.setWidgetActive(widgetToSelectKey, this.widgetElements.get(widgetToSelectKey), true);
        } else {
            this.fetchAndAppendWidget(widget);
        }

        const isProjectSelectorShown: boolean = widget.getConfig().getProperty('context') === 'project';

        if (isProjectSelectorShown) {
            this.appBar.showProjectSelector();
        } else {
            this.appBar.hideProjectSelector();
        }

        this.appBar.setAppName(widget.getDisplayName());
    }

    private updateUrl(widget: Readonly<Widget>): void {
        if (isDefaultWidget(widget)) {
            Router.get().setHash(UrlAction.BROWSE);
            return;
        }

        const appKeyLastPart: string = widget.getWidgetDescriptorKey().getApplicationKey().getName().split('.').pop();
        const widgetName: string = widget.getWidgetDescriptorKey().getName();
        Router.get().setHash(`widget/${appKeyLastPart}/${widgetName}`);
    }

    private updateTabName(widget: Readonly<Widget>): void {
        const prefix: string = i18n('admin.tool.displayName');
        const postfix: string =
            isDefaultWidget(widget) || !widget.getDisplayName()
                ? i18n('app.admin.tool.title')
                : widget.getDisplayName();
        document.title = `${prefix} - ${postfix}`;
    }

    private fetchAndAppendWidget(widget: Readonly<Widget>): void {
        if (isDefaultWidget(widget)) {
            // default studio app
            const widgetEl: Element = this.createStudioWidgetEl();
            this.widgetElements.set(widget.getWidgetDescriptorKey().toString(), {el: widgetEl});
            this.widgetsBlock.appendChild(widgetEl);
            return;
        }

        fetch(widget.getFullUrl())
            .then((response) => response.text())
            .then((html: string) => {
                WidgetHelper.createFromHtmlAndAppend(html, this.widgetsBlock).then((widgetEl: WidgetElement) => {
                    const widgetKey = widget.getWidgetDescriptorKey().toString();
                    this.widgetElements.set(widgetKey, widgetEl);
                    this.activeWidgets.push(widgetKey);
                });
            })
            .catch((err) => {
                throw new Error('Failed to fetch widget: ' + err);
            });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const headerAndWidgetsBlock: DivEl = new DivEl('header-widgets-block');
            headerAndWidgetsBlock.appendChildren(this.appBar, this.widgetsBlock);
            this.appendChildren(this.sidebar, headerAndWidgetsBlock);

            ResponsiveManager.onAvailableSizeChanged(this.appBar);

            return rendered;
        });
    }

    private setWidgetActive(key: string, widgetEl: WidgetElement, active: boolean): void {
        widgetEl.el.setVisible(active);
        if (this.isInternalWidget(key)) {
            return;
        }

        const isWidgetActive = this.activeWidgets.findIndex((activeWidgetKey: string) => activeWidgetKey === key) > -1;
        if (isWidgetActive !== active) {
            if (isWidgetActive) {
                widgetEl.assets?.forEach((asset: HTMLElement) => asset.remove());
                this.activeWidgets = this.activeWidgets.filter((activeWidgetKey: string) => activeWidgetKey !== key);
            } else {
                widgetEl.assets?.forEach((asset: HTMLElement) => document.head.appendChild(asset));
                this.activeWidgets.push(key);
            }
        }
    }

    private isInternalWidget(key: string): boolean {
        return key === CONFIG.get('appId');
    }
}
