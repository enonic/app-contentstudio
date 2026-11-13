import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { type DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { type IFrameEl } from '@enonic/lib-admin-ui/dom/IFrameEl';
import { WindowDOM } from '@enonic/lib-admin-ui/dom/WindowDOM';
import { ObjectHelper } from '@enonic/lib-admin-ui/ObjectHelper';
import { LoadMask } from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import { type Mask } from '@enonic/lib-admin-ui/ui/mask/Mask';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { type LiveEditModel } from '../../../page-editor/LiveEditModel';
import {
    start as startComponentInspectionService,
    stop as stopComponentInspectionService,
} from '../../../v6/widgets/inspectors/model/component-inspection.service';
import {
    start as startFragmentInspectionService,
    stop as stopFragmentInspectionService,
} from '../../../v6/widgets/inspectors/model/fragment-inspection.service';
import {
    $activeWidget,
    $isLiveViewImageEditorActive,
} from '../../../v6/widgets/inspectors/model/liveViewWidgets.store';
import {
    $isPageLocked,
    $pageEditorLifecycle,
    cleanupPageEditorBridge,
    initPageEditorBridge,
    setPageModifyAllowed,
    syncInitialRenderable,
} from '../../../v6/widgets/inspectors/model/page-editor';
import {
    start as startPageInspectionService,
    stop as stopPageInspectionService,
} from '../../../v6/widgets/inspectors/model/page-inspection.service';
import { type Content } from '../../content/Content';
import { type Site } from '../../content/Site';
import { type ComponentPath } from '../../page/region/ComponentPath';
import { type ExtensionRenderer } from '../../view/ExtensionRenderingHandler';
import { setWizardPageTemplateSource } from '../../../v6/pages/wizard/model/wizardPageTemplate.commands';
import { PageEventsManager } from '../PageEventsManager';
import { type PageNavigationEvent } from '../PageNavigationEvent';
import { type PageNavigationHandler } from '../PageNavigationHandler';
import { PageNavigationMediator } from '../PageNavigationMediator';
import { WizardExtensionRenderingHandler } from '../WizardExtensionRenderingHandler';
import { FrameContainer } from './FrameContainer';
import { LiveEditPageProxy } from './LiveEditPageProxy';
import { getWizardController } from '../../../v6/pages/wizard/model/wizardController';
import { PageState } from './PageState';
import { toContentTypeName } from '../../../v6/shared/lib/cms/schema/contentTypeName';

export interface LiveFormPanelConfig {
    liveEditModel: LiveEditModel;
}

export class LiveFormPanel extends Panel implements PageNavigationHandler, ExtensionRenderer {
    public static debug: boolean = false;

    private content: Content;

    private liveEditModel?: LiveEditModel;

    private pageSkipReload: boolean = false;

    private frameContainer?: FrameContainer;

    private lockPageAfterProxyLoad: boolean = false;

    private modifyPermissions: boolean;

    private liveEditPageProxy?: LiveEditPageProxy;

    private mask?: LoadMask;

    private widgetRenderingHandler: WizardExtensionRenderingHandler;

    private unsubscribePageLocked: () => void;

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel extension-preview-panel');

        this.liveEditPageProxy = new LiveEditPageProxy(config.liveEditModel);
        this.content = config.liveEditModel.getContent();

        this.widgetRenderingHandler = new WizardExtensionRenderingHandler(this);

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();

        this.setModel(config.liveEditModel);

        this.unsubscribePageLocked = $isPageLocked.listen((locked) => this.liveEditPageProxy?.setLocked(locked));
    }

    getIFrameEl(): IFrameEl {
        return this.liveEditPageProxy.getIFrame();
    }

    getChildrenContainer(): DivEl {
        return this.getFrameContainer().getWrapper();
    }

    private refresh(): void {
        const widget = $activeWidget.get();
        void this.widgetRenderingHandler.render(this.content, widget);
    }

    getMask(): Mask {
        return this.mask;
    }

    /** Hides the load mask when the page editor goes out of view while it is loading. */
    hideLoadMask(): void {
        if (this.mask?.isVisible()) {
            this.mask.hide();
        }
    }

    protected initElements(): void {
        this.frameContainer = new FrameContainer({
            proxy: this.liveEditPageProxy,
        });

        // Scoped to the frame contents (image editor + iframe wrapper), so the
        // preview toolbar above them stays interactive while the preview is loading.
        this.mask = new LoadMask(this.frameContainer.getContents()).addClass('live-load-mask') as LoadMask;

        this.frameContainer.getToolbar().setRefreshAction(() => this.refresh());
        this.liveEditPageProxy.setModifyPermissions(this.modifyPermissions);
        this.addPageProxyLoadEventListeners();
    }

    private addPageProxyLoadEventListeners(): void {
        PageEventsManager.get().onLoaded(() => {
            if (this.lockPageAfterProxyLoad) {
                this.liveEditPageProxy?.setLocked(true);
                this.lockPageAfterProxyLoad = false;
            }
        });

        PageEventsManager.get().onComponentReloadRequested((path, existing) => {
            this.saveAndReloadComponent(path, existing);
        });
    }

    private saveAndReloadComponent(path: ComponentPath, existing: boolean): void {
        const controller = getWizardController();
        if (!controller) return;

        this.pageSkipReload = true;
        controller
            .save({ reloadPageEditor: false })
            .then(() => {
                if ($pageEditorLifecycle.get().inlineEditing) {
                    this.liveEditPageProxy?.loadComponent(path, existing);
                    return;
                }

                this.pageSkipReload = false;
                void this.loadPage();
            })
            .catch(DefaultErrorHandler.handle)
            .finally(() => {
                this.pageSkipReload = false;
            });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.frameContainer);
            // we handle widget event manually in LiveEditPageProxy
            this.widgetRenderingHandler.layout();

            WindowDOM.get().onBeforeUnload((event) => {
                // the reload is triggered by the main frame,
                // so let the live edit know it to skip the popup
                this.liveEditPageProxy?.skipNextReloadConfirmation(true);
            });

            return rendered;
        });
    }

    remove(): LiveFormPanel {
        this.widgetRenderingHandler.destroy();

        this.unsubscribePageLocked();
        this.liveEditPageProxy.remove();
        stopComponentInspectionService();
        stopFragmentInspectionService();
        stopPageInspectionService();
        cleanupPageEditorBridge();
        super.remove();
        return this;
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
        this.content = liveEditModel.getContent();

        const site: Site = this.content.isSite()
            ? (this.content as Site)
            : liveEditModel.getSiteModel()
              ? this.liveEditModel.getSiteModel().getSite()
              : null;

        setWizardPageTemplateSource(this.content, site);

        this.liveEditPageProxy.setModel(liveEditModel);

        const content = liveEditModel.getContent();
        const siteModel = liveEditModel.getSiteModel();
        const controller = PageState.getState()?.getController();
        const defaultModels = liveEditModel.getDefaultModels();

        initPageEditorBridge({
            hasDefaultPageTemplate: defaultModels?.hasDefaultPageTemplate() ?? false,
            defaultPageTemplateName: defaultModels?.getDefaultPageTemplate()?.getDisplayName() ?? null,
            contentContext: {
                contentId: content.getContentId(),
                contentTypeName: toContentTypeName(content.getType().toString()),
                siteId: site?.getContentId() ?? null,
                sitePath: site?.getPath().toString() ?? null,
                isPageTemplate: content.isPageTemplate(),
                isInherited: content.isInherited(),
                isDataInherited: content.isDataInherited(),
                applicationKey: controller?.getApplicationKey().toString() ?? null,
            },
        });

        startPageInspectionService(siteModel);
        startComponentInspectionService(siteModel);
        startFragmentInspectionService();

        // Sync renderable state that may have been set before bridge init
        void this.widgetRenderingHandler.isItemRenderable().then((isRenderable: boolean) => {
            syncInitialRenderable(isRenderable);
        });
    }

    public getModel(): LiveEditModel {
        return this.liveEditModel;
    }

    skipNextReloadConfirmation(skip: boolean) {
        this.liveEditPageProxy?.skipNextReloadConfirmation(skip);
    }

    onRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.widgetRenderingHandler.onRenderableChanged(listener);
    }

    unRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.widgetRenderingHandler.unRenderableChanged(listener);
    }

    loadPage(): Promise<boolean> {
        if (LiveFormPanel.debug) {
            console.debug('LiveFormPanel.loadPage at ' + new Date().toISOString());
        }

        if (this.pageSkipReload) {
            return Promise.resolve(false);
        }

        // `LiveViewImageEditor` replaces the page, so only the preview is resolved.
        if ($isLiveViewImageEditorActive.get()) {
            return this.widgetRenderingHandler.render(this.content, $activeWidget.get());
        }

        return this.liveEditPageProxy.load(this.widgetRenderingHandler, $activeWidget.get());
    }

    isShown(): boolean {
        return !ObjectHelper.stringEquals(this.getHTMLElement().style.display, 'none');
    }

    setEnabled(enabled: boolean): void {
        this.modifyPermissions = enabled;
        setPageModifyAllowed(enabled);
        this.liveEditPageProxy?.setModifyPermissions(enabled);
    }

    unloadPage(): void {
        // ! Iframe-only unload. Inspection stores stay alive so the inspect
        // ! panel keeps showing controllers while the iframe is not renderable.
        // ! Store cleanup runs in remove() when the wizard is destroyed.
        this.liveEditPageProxy?.unload();
        this.liveEditModel = null;
    }

    handle(event: PageNavigationEvent): void {
        //
    }

    setSaveEnabled(enabled: boolean): void {
        //
    }

    getFrameContainer() {
        return this.frameContainer;
    }
}
