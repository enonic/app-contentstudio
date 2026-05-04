import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element, NewElementBuilder} from '@enonic/lib-admin-ui/dom/Element';
import type {Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ExtensionElement, ExtensionHelper} from '@enonic/lib-admin-ui/extension/ExtensionHelper';
import {cn} from '@enonic/ui';
import type Q from 'q';
import {$activeWidget, $sidebarWidgets, getSettingsWidget, isDefaultWidget, isSettingsWidget, setActiveWidget} from '../v6/features/store/sidebarWidgets.store';
import {$noProjectMode} from '../v6/features/store/projects.store';
import {BrowseAppBarElement} from '../v6/features/views/browse/layout/BrowseAppBar';
import {BrowseSidebarElement} from '../v6/features/views/browse/layout/BrowseSidebar';
import {ContentAppContainer} from './ContentAppContainer';
import {Router} from './Router';
import {UrlAction} from './UrlAction';

export class AppWrapper extends DivEl {
    private sidebar: BrowseSidebarElement;

    private extensionElements: Map<string, ExtensionElement> = new Map<string, ExtensionElement>();

    private activeExtensions: string[] = [];

    private appBar: BrowseAppBarElement;

    private extensionsBlock: DivEl;

    private noProjectMode: boolean = $noProjectMode.get();

    constructor(className?: string) {
        super(cn('main-app-wrapper text-main', className));

        this.initElements();
        this.initListeners();
        this.setNoProjectMode(this.noProjectMode);
    }

    private initElements() {
        this.sidebar = new BrowseSidebarElement();
        this.appBar = BrowseAppBarElement.getInstance();
        this.extensionsBlock = new DivEl('extensions-block');
    }

    private initListeners() {
        const syncNoProjectWidget = () => {
            if (!this.noProjectMode) {
                return;
            }

            const settingsWidget = getSettingsWidget($sidebarWidgets.get().widgets);
            if (settingsWidget && !isSettingsWidget($activeWidget.get())) {
                setActiveWidget(settingsWidget);
            }
        };

        $activeWidget.subscribe((value) => {
            if (!value) {
                syncNoProjectWidget();
                return;
            }

            if (this.noProjectMode && !isSettingsWidget(value)) {
                syncNoProjectWidget();
                return;
            }

            this.selectExtension(value);
        });

        $sidebarWidgets.subscribe(() => {
            syncNoProjectWidget();
        });

        $noProjectMode.subscribe((value) => {
            if (value !== this.noProjectMode) {
                this.setNoProjectMode(value);
            }
        });
    }

    private createStudioWidgetEl(): Element {
        const extensionEl: Element = new Element(new NewElementBuilder().setTagName('extension')).setId('extension-studio');
        const appContainer: ContentAppContainer = new ContentAppContainer();

        appContainer.onShown(() => {
            this.appBar.showIssuesButton();
        });

        appContainer.onHidden(() => {
            this.appBar.hideIssuesButton();
        });

        extensionEl.appendChild(appContainer);

        return extensionEl;
    }

    selectExtension(extension: Readonly<Extension>) {
        const extensionToSelectKey: string = extension.getDescriptorKey().toString();
        this.extensionElements.forEach((extensionEl: ExtensionElement, key: string) => {
            if (key !== extensionToSelectKey) {
                this.setExtensionActive(key, extensionEl, false);
            }
        });
        this.updateUrl(extension);
        this.updateTabName(extension);

        if (this.extensionElements.has(extensionToSelectKey)) {
            this.setExtensionActive(extensionToSelectKey, this.extensionElements.get(extensionToSelectKey), true);
        } else {
            this.fetchAndAppendWidget(extension);
        }

        const isProjectSelectorShown: boolean = extension.getConfig().getProperty('context') === 'project';

        if (isProjectSelectorShown) {
            this.appBar.showProjectSelector();
        } else {
            this.appBar.hideProjectSelector();
        }

        this.appBar.setAppName(extension.getDisplayName());
    }

    private updateUrl(extension: Readonly<Extension>): void {
        if (this.noProjectMode) {
            return;
        }

        if (isDefaultWidget(extension)) {
            Router.get().setHash(UrlAction.BROWSE);
            return;
        }

        const appKeyLastPart: string = extension.getDescriptorKey().getApplicationKey().getName().split('.').pop();
        const extensionName: string = extension.getDescriptorKey().getName();
        Router.get().setHash(`widget/${appKeyLastPart}/${extensionName}`);
    }

    private updateTabName(widget: Readonly<Extension>): void {
        const prefix: string = i18n('admin.tool.displayName');
        const postfix: string =
            isDefaultWidget(widget) || !widget.getDisplayName()
                ? i18n('app.admin.tool.title')
                : widget.getDisplayName();
        document.title = `${prefix} - ${postfix}`;
    }

    private fetchAndAppendWidget(widget: Readonly<Extension>): void {
        if (isDefaultWidget(widget)) {
            // default studio app
            const extensionEl: Element = this.createStudioWidgetEl();
            this.extensionElements.set(widget.getDescriptorKey().toString(), {el: extensionEl});
            this.extensionsBlock.appendChild(extensionEl);
            return;
        }

        fetch(widget.getFullUrl())
            .then((response) => response.text())
            .then((html: string) => {
                ExtensionHelper.createFromHtmlAndAppend(html, this.extensionsBlock).then((extensionEl: ExtensionElement) => {
                    const widgetKey = widget.getDescriptorKey().toString();
                    this.extensionElements.set(widgetKey, extensionEl);
                    this.activeExtensions.push(widgetKey);
                });
            })
            .catch((err) => {
                throw new Error('Failed to fetch widget: ' + err);
            });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const headerAndWidgetsBlock: DivEl = new DivEl('header-widgets-block');
            headerAndWidgetsBlock.appendChildren(this.appBar, this.extensionsBlock);
            this.appendChildren(this.sidebar, headerAndWidgetsBlock);
            this.setNoProjectMode(this.noProjectMode);

            ResponsiveManager.onAvailableSizeChanged(this.appBar);

            return rendered;
        });
    }

    private setExtensionActive(key: string, extensionEl: ExtensionElement, active: boolean): void {
        extensionEl.el.setVisible(active);
        if (this.isInternalExtension(key)) {
            return;
        }

        const isExtensionActive = this.activeExtensions.findIndex((activeExtensionKey: string) => activeExtensionKey === key) > -1;
        if (isExtensionActive !== active) {
            if (isExtensionActive) {
                extensionEl.assets?.forEach((asset: HTMLElement) => asset.remove());
                this.activeExtensions = this.activeExtensions.filter((activeWidgetKey: string) => activeWidgetKey !== key);
            } else {
                extensionEl.assets?.forEach((asset: HTMLElement) => document.head.appendChild(asset));
                this.activeExtensions.push(key);
            }
        }
    }

    private isInternalExtension(key: string): boolean {
        return key === CONFIG.get('appId');
    }

    private setNoProjectMode(enabled: boolean): void {
        const wasNoProjectMode = this.noProjectMode;
        this.noProjectMode = enabled;

        if (!enabled) {
            if (wasNoProjectMode) {
                const activeWidget = $activeWidget.get();
                if (activeWidget) {
                    this.updateUrl(activeWidget);
                }
            }

            return;
        }

        const settingsWidget = getSettingsWidget($sidebarWidgets.get().widgets);
        if (settingsWidget && !isSettingsWidget($activeWidget.get())) {
            setActiveWidget(settingsWidget);
        }
    }
}
