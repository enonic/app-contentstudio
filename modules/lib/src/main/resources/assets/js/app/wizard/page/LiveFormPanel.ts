import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import type {default as Q} from 'q';
import {type LiveEditModel} from '../../../page-editor/LiveEditModel';
import {cleanupComponentInspection, initComponentInspectionService} from '../../../v6/features/store/component-inspection.store';
import {cleanupFragmentInspection, initFragmentInspectionService} from '../../../v6/features/store/fragment-inspection.store';
import {$activeWidget} from '../../../v6/features/store/liveViewWidgets.store';
import {cleanupPageEditorBridge, initPageEditorBridge, syncInitialRenderable} from '../../../v6/features/store/page-editor';
import {cleanupPageInspection, initPageInspectionService} from '../../../v6/features/store/page-inspection.store';
import {type Content} from '../../content/Content';
import {type Site} from '../../content/Site';
import {type ContentType} from '../../inputtype/schema/ContentType';
import {type ComponentPath} from '../../page/region/ComponentPath';
import {type ContextPanelState} from '../../view/context/ContextPanelState';
import {type ContextPanelMode} from '../../view/context/ContextSplitPanel';
import {type ExtensionRenderer} from '../../view/ExtensionRenderingHandler';
import {SaveAsTemplateAction} from '../action/SaveAsTemplateAction';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {PageEventsManager} from '../PageEventsManager';
import {type PageNavigationEvent} from '../PageNavigationEvent';
import {type PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {WizardExtensionRenderingHandler} from '../WizardExtensionRenderingHandler';
import {FrameContainer} from './FrameContainer';
import {type LiveEditPageProxy} from './LiveEditPageProxy';
import {PageState} from './PageState';

export interface LiveFormPanelConfig {

    contentType: ContentType;

    contentWizardPanel: ContentWizardPanel;

    liveEditPage: LiveEditPageProxy;

    liveEditModel: LiveEditModel;
}

export class LiveFormPanel
    extends Panel
    implements PageNavigationHandler, ExtensionRenderer {

    public static debug: boolean = false;

    private content: Content;

    private liveEditModel?: LiveEditModel;

    private pageSkipReload: boolean = false;

    private frameContainer?: FrameContainer;

    private lockPageAfterProxyLoad: boolean = false;

    private modifyPermissions: boolean;

    private contentWizardPanel: ContentWizardPanel;

    private liveEditPageProxy?: LiveEditPageProxy;

    private widgetRenderingHandler: WizardExtensionRenderingHandler;

    private showLoadMaskHandler: () => void;
    private hideLoadMaskHandler: () => void;

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel extension-preview-panel');

        this.contentWizardPanel = config.contentWizardPanel;
        this.liveEditPageProxy = config.liveEditPage;
        this.content = config.liveEditModel.getContent();

        this.widgetRenderingHandler = new WizardExtensionRenderingHandler(this);

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();

        this.setModel(config.liveEditModel);
    }

    getIFrameEl(): IFrameEl {
        return this.liveEditPageProxy.getIFrame();
    }

    getChildrenContainer(): DivEl {
        return this.getFrameContainer().getWrapper();
    }

    getPreviewAction(): Action {
        return this.contentWizardPanel.getWizardActions().getPreviewAction();
    }

    private refresh(): void {
        const widget = $activeWidget.get();
        void this.widgetRenderingHandler.render(this.content, widget);
    }

    getMask(): Mask {
        return this.contentWizardPanel.getLiveMask();
    }

    protected initElements(): void {
        this.frameContainer = new FrameContainer({
            proxy: this.liveEditPageProxy,
        });

        this.frameContainer.getToolbar().setRefreshAction(() => this.refresh());
        this.liveEditPageProxy.setModifyPermissions(this.modifyPermissions);
        this.addPageProxyLoadEventListeners();
    }

    hasControllers(): Q.Promise<boolean> {
        return this.widgetRenderingHandler.hasControllers();
    }

    isRenderable(): Q.Promise<boolean> {
        return this.widgetRenderingHandler.isItemRenderable();
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
        this.pageSkipReload = true;
        this.contentWizardPanel.saveChangesWithoutValidation(false)
            .then(() => {
                this.liveEditPageProxy?.loadComponent(path, existing);
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
        ShowLiveEditEvent.un(this.showLoadMaskHandler);
        ShowContentFormEvent.un(this.hideLoadMaskHandler);

        this.liveEditPageProxy.remove();
        super.remove();
        return this;
    }

    setModel(liveEditModel: LiveEditModel) {

        this.liveEditModel = liveEditModel;
        this.content = liveEditModel.getContent();

        const site: Site = this.content.isSite()
                           ? this.content as Site
                           : liveEditModel.getSiteModel()
                             ? this.liveEditModel.getSiteModel().getSite()
                             : null;

        SaveAsTemplateAction.get()
            .setContentSummary(this.content)
            .setSite(site);

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
                contentTypeName: content.getType(),
                siteId: siteModel?.getSiteId() ?? null,
                sitePath: siteModel?.getSite().getPath().toString() ?? null,
                isPageTemplate: content.isPageTemplate(),
                isInherited: content.isInherited(),
                isDataInherited: content.isDataInherited(),
                applicationKey: controller?.getApplicationKey() ?? null,
            },
        });

        initPageInspectionService();
        initComponentInspectionService();
        initFragmentInspectionService();

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

    loadPage(clearInspection: boolean = true): Promise<boolean> {
        if (LiveFormPanel.debug) {
            console.debug('LiveFormPanel.loadPage at ' + new Date().toISOString());
        }

        if (this.pageSkipReload) {
            return Promise.resolve(false);
        }

        return this.liveEditPageProxy.load(this.widgetRenderingHandler, $activeWidget.get())
            .then((loaded) => {
                if (clearInspection) {
                    const clearInspectionFn = () => {
                        PageEventsManager.get().unLoaded(clearInspectionFn);
                    };
                    PageEventsManager.get().onLoaded(clearInspectionFn);
                }

                return loaded;
            });
    }

    isShown(): boolean {
        return !ObjectHelper.stringEquals(this.getHTMLElement().style.display, 'none');
    }

    setEnabled(enabled: boolean): void {
        this.modifyPermissions = enabled;
        this.liveEditPageProxy?.setModifyPermissions(enabled);
    }

    setContextPanelMode(mode: ContextPanelMode): void {
        //
    }

    setContextPanelState(state: ContextPanelState): void {
        //
    }

    unloadPage(): void {
        this.liveEditPageProxy?.unload();
        this.liveEditModel = null;
        cleanupComponentInspection();
        cleanupFragmentInspection();
        cleanupPageInspection();
        cleanupPageEditorBridge();
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

    setToggleContextPanelHandler(handler: () => void) {
        //
    }
}
