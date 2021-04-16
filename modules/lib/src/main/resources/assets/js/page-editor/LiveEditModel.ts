import * as Q from 'q';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PageModel, SetController, SetTemplate} from './PageModel';
import {SiteModel} from '../app/site/SiteModel';
import {GetPageTemplateByKeyRequest} from '../app/resource/GetPageTemplateByKeyRequest';
import {ContentFormContext} from '../app/ContentFormContext';
import {Content} from '../app/content/Content';
import {PageTemplate} from '../app/content/PageTemplate';
import {PageMode} from '../app/page/PageMode';
import {Page} from '../app/page/Page';
import {Regions} from '../app/page/region/Regions';
import {PageTemplateKey} from '../app/page/PageTemplateKey';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {Exception, ExceptionType} from 'lib-admin-ui/Exception';
import {GetComponentDescriptorRequest} from '../app/resource/GetComponentDescriptorRequest';
import {Descriptor} from '../app/page/Descriptor';
import {DescriptorKey} from '../app/page/DescriptorKey';

export class LiveEditModel {

    private siteModel: SiteModel;

    private parentContent: Content;

    private content: Content;

    private formContext: ContentFormContext;

    private pageModel: PageModel;

    constructor(builder: LiveEditModelBuilder) {
        this.siteModel = builder.siteModel;
        this.parentContent = builder.parentContent;
        this.content = builder.content;
        this.formContext = builder.formContext;
    }

    init(defaultTemplate: PageTemplate, defaultTemplateDescriptor: Descriptor): Q.Promise<PageModel> {

        return LiveEditModelInitializer.initPageModel(this, this.content, defaultTemplate, defaultTemplateDescriptor)
            .then((pageModel: PageModel) => {
                this.pageModel = pageModel;
                return pageModel;
            });
    }

    isPageRenderable(): boolean {
        return !!this.pageModel && (this.pageModel.hasController() ||
                                    this.pageModel.getMode() !== PageMode.NO_CONTROLLER);
    }

    setContent(value: Content): void {
        this.content = value;
    }

    getParentContent(): Content {
        return this.parentContent;
    }

    getFormContext(): ContentFormContext {
        return this.formContext;
    }

    getContent(): Content {
        return this.content;
    }

    getSiteModel(): SiteModel {
        return this.siteModel;
    }

    getPageModel(): PageModel {
        return this.pageModel;
    }

    isRenderableContent(): boolean {
        const hasApplications: boolean = this.siteModel.getApplicationKeys().length > 0;

        return hasApplications || this.hasControllerOrDefaultTemplate();
    }

    hasControllerOrDefaultTemplate(): boolean {
        const hasController: boolean = this.pageModel.hasController();
        const hasDefaultPageTemplate: boolean = this.pageModel.hasDefaultPageTemplate();

        return hasController || hasDefaultPageTemplate;
    }

    isFragmentAllowed(): boolean {
        if (this.content.getType().isFragment()) {
            return false;
        }

        if (this.content.getType().isPageTemplate()) {
            return false;
        }

        return true;
    }

    static create(): LiveEditModelBuilder {
        return new LiveEditModelBuilder();
    }
}

export class LiveEditModelBuilder {

    siteModel: SiteModel;

    parentContent: Content;

    content: Content;

    formContext: ContentFormContext;

    setSiteModel(value: SiteModel): LiveEditModelBuilder {
        this.siteModel = value;
        return this;
    }

    setParentContent(value: Content): LiveEditModelBuilder {
        this.parentContent = value;
        return this;
    }

    setContent(value: Content): LiveEditModelBuilder {
        this.content = value;
        return this;
    }

    setContentFormContext(value: ContentFormContext): LiveEditModelBuilder {
        this.formContext = value;
        return this;
    }

    build(): LiveEditModel {
        return new LiveEditModel(this);
    }
}

export class LiveEditModelInitializer {

    static loadForcedPageTemplate(content: Content): Q.Promise<PageTemplate> {
        if (content && content.isPage()) {
            if (content.getPage().hasTemplate()) {
                return this.loadPageTemplate(content.getPage().getTemplate())
                    .then(pageTemplate => {
                        // despite listed in page, template might have lost its support for rendering content
                        return pageTemplate.isCanRender(content.getType()) ? pageTemplate : null;
                    })
                    .fail(reason => {
                        // template might have been deleted
                        return null;
                    });
            }
        }
        return Q(<PageTemplate>null);
    }

    static initPageModel(liveEditModel: LiveEditModel, content: Content, defaultPageTemplate: PageTemplate,
                         defaultTemplateDescriptor: Descriptor): Q.Promise<PageModel> {

        const promises: Q.Promise<any>[] = [];

        return this.loadForcedPageTemplate(content).then(forcedPageTemplate => {
            const pageMode = LiveEditModelInitializer.getPageMode(content, !!defaultPageTemplate, forcedPageTemplate);

            let pageModel: PageModel = liveEditModel.getPageModel();
            if (!pageModel) {
                pageModel = new PageModel(liveEditModel, defaultPageTemplate, defaultTemplateDescriptor, pageMode);
            } else {
                pageModel.update(defaultPageTemplate, defaultTemplateDescriptor, pageMode);
            }

            if (content.isPageTemplate()) {
                this.initPageTemplate(content, pageMode, pageModel, promises);
            } else {
                this.initPage(content, pageMode, pageModel, promises, forcedPageTemplate);
            }

            return this.resolvePromises(pageModel, promises);
        });
    }

    private static initPageTemplate(content: Content, pageMode: PageMode, pageModel: PageModel, promises: Q.Promise<any>[]): void {
        let pageTemplate: PageTemplate = <PageTemplate>content;
        if (pageMode === PageMode.FORCED_CONTROLLER) {
            this.initForcedControllerPageTemplate(pageTemplate, pageModel, promises);
        } else if (pageMode === PageMode.NO_CONTROLLER) {
            this.initNoControllerPageTemplate(pageTemplate, pageModel);
        } else {
            throw new Error(i18n('live.view.page.error.templmodenotsupported', pageMode));
        }
    }

    private static initPage(content: Content, pageMode: PageMode, pageModel: PageModel, promises: Q.Promise<any>[],
                            forcedPageTemplate: PageTemplate): void {
        const page: Page = content.getPage();
        if (pageMode === PageMode.FORCED_TEMPLATE) {
            this.initForcedTemplatePage(content, page, pageModel, promises, forcedPageTemplate);
        } else if (pageMode === PageMode.FORCED_CONTROLLER) {
            this.initForcedControllerPage(page, pageModel, promises);
        } else if (pageMode === PageMode.AUTOMATIC) {
            pageModel.setAutomaticTemplate(this);
        } else if (pageMode === PageMode.NO_CONTROLLER || pageMode === PageMode.FRAGMENT) {
            this.initNoControllerPage(pageModel);
        } else {
            throw new Error(i18n('live.view.page.error.contentmodenotsupported', PageMode[<number>pageMode]));
        }
    }

    private static initForcedControllerPageTemplate(pageTemplate: PageTemplate,
                                                    pageModel: PageModel,
                                                    promises: Q.Promise<any>[]): void {
        const pageDescriptorKey: DescriptorKey = pageTemplate.getController();
        const pageDescriptorPromise: Q.Promise<Descriptor> = this.loadPageDescriptor(pageDescriptorKey);
        pageDescriptorPromise.then((pageDescriptor: Descriptor) => {

            const config: PropertyTree = pageTemplate.hasConfig() ? pageTemplate.getPage().getConfig().copy() : new PropertyTree();

            const regions: Regions = pageTemplate.hasRegions() ? pageTemplate.getRegions().clone() : Regions.create().build();

            const setController: SetController = new SetController(this)
                .setDescriptor(pageDescriptor).setConfig(config).setRegions(regions);
            pageModel.initController(setController);
        });

        promises.push(pageDescriptorPromise);
    }

    private static initNoControllerPageTemplate(pageTemplate: PageTemplate, pageModel: PageModel): void {
        const config: PropertyTree = pageTemplate.hasConfig() ? pageTemplate.getConfig().copy() : new PropertyTree();

        const regions: Regions = pageTemplate.hasRegions() ? pageTemplate.getRegions().clone() : Regions.create().build();

        const setController: SetController = new SetController(this).setDescriptor(null).setConfig(config).setRegions(regions);
        pageModel.initController(setController);
    }

    private static initForcedTemplatePage(content: Content,
                                          page: Page,
                                          pageModel: PageModel,
                                          promises: Q.Promise<any>[], forcedPageTemplate?: PageTemplate): void {
        const pageTemplateKey: PageTemplateKey = page.getTemplate();
        const pageTemplatePromise: Q.Promise<PageTemplate> = !forcedPageTemplate ? this.loadPageTemplate(pageTemplateKey) : Q(
            forcedPageTemplate);

        pageTemplatePromise.then((pageTemplate: PageTemplate) => {

            const pageDescriptorKey: DescriptorKey = pageTemplate.getController();
            const pageDescriptorPromise: Q.Promise<Descriptor> = LiveEditModelInitializer.loadPageDescriptor(pageDescriptorKey);
            pageDescriptorPromise.then((pageDescriptor: Descriptor) => {

                const config: PropertyTree = content.getPage().hasNonEmptyConfig()
                                             ? content.getPage().getConfig().copy()
                                             : (pageTemplate.getConfig() ? pageTemplate.getConfig().copy() : pageTemplate.getConfig());

                const regions: Regions = content.getPage().hasNonEmptyRegions()
                                         ? content.getPage().getRegions().clone()
                                         : (pageTemplate.getRegions() ? pageTemplate.getRegions().clone() : pageTemplate.getRegions());

                let setTemplate: SetTemplate = new SetTemplate(this)
                    .setTemplate(pageTemplate, pageDescriptor).setRegions(regions).setConfig(config);
                pageModel.initTemplate(setTemplate);
            });
            promises.push(pageDescriptorPromise);
        });
        promises.push(pageTemplatePromise);
    }

    private static initForcedControllerPage(page: Page, pageModel: PageModel, promises: Q.Promise<any>[]): void {
        const pageDescriptorKey: DescriptorKey = page.getController();

        if (pageDescriptorKey) {
            const pageDescriptorPromise: Q.Promise<Descriptor> = this.loadPageDescriptor(pageDescriptorKey);
            pageDescriptorPromise.then((pageDescriptor: Descriptor) => {
                this.initPageController(page, pageModel, pageDescriptor);
            });
            promises.push(pageDescriptorPromise);
        } else {
            this.initPageController(page, pageModel, null);
        }
    }

    private static initNoControllerPage(pageModel: PageModel): void {
        const config: PropertyTree = new PropertyTree();

        const regions: Regions = Regions.create().build();

        const setController: SetController = new SetController(this).setDescriptor(null).setConfig(config).setRegions(regions);
        pageModel.initController(setController);
    }

    private static initPageController(page: Page, pageModel: PageModel, pageDescriptor: Descriptor): void {

        const config: PropertyTree = page.hasConfig() ? page.getConfig().copy() : new PropertyTree();

        const regions: Regions = page.hasRegions() ? page.getRegions().clone() : Regions.create().build();

        const setController: SetController = new SetController(this)
            .setDescriptor(pageDescriptor).setConfig(config).setRegions(regions);

        pageModel.initController(setController);
    }

    private static getPageMode(content: Content, defaultTemplatePresents: boolean,
                               forcedPageTemplate: PageTemplate): PageMode {
        if (forcedPageTemplate) {
            return PageMode.FORCED_TEMPLATE;
        }

        if (content.getType().isFragment()) {
            return PageMode.FRAGMENT;
        }

        if (content.isPage()) {
            if (content.getPage().hasTemplate()) {
                //in case content's template was deleted or updated to not support content's type
                showWarning(i18n('live.view.page.error.pagetemplatenotfound'));

                if (defaultTemplatePresents) {
                    return PageMode.AUTOMATIC;

                } else {
                    return PageMode.NO_CONTROLLER;
                }
            } else {
                return PageMode.FORCED_CONTROLLER;
            }
        } else if (defaultTemplatePresents) {
            return PageMode.AUTOMATIC;
        } else {
            return PageMode.NO_CONTROLLER;
        }
    }

    private static loadPageTemplate(key: PageTemplateKey): Q.Promise<PageTemplate> {
        let deferred: Q.Deferred<PageTemplate> = Q.defer<PageTemplate>();
        new GetPageTemplateByKeyRequest(key).sendAndParse().then((pageTemplate: PageTemplate) => {
            deferred.resolve(pageTemplate);
        }).catch(() => {
            deferred.reject(new Exception(i18n('live.view.page.error.templatenotfound', key), ExceptionType.WARNING));
        }).done();
        return deferred.promise;
    }

    private static loadPageDescriptor(key: DescriptorKey): Q.Promise<Descriptor> {
        let deferred: Q.Deferred<Descriptor> = Q.defer<Descriptor>();
        new GetComponentDescriptorRequest(key.toString()).sendAndParse().then((pageDescriptor: Descriptor) => {
            deferred.resolve(pageDescriptor);
        }).catch(() => {
            deferred.reject(new Exception(i18n('live.view.page.error.descriptornotfound', key), ExceptionType.WARNING));
        }).done();
        return deferred.promise;
    }

    private static resolvePromises(pageModel: PageModel, promises: Q.Promise<any>[]): Q.Promise<PageModel> {
        let deferred: Q.Deferred<PageModel> = Q.defer<PageModel>();

        if (promises.length > 0) {
            Q.all(promises).then(() => {
                deferred.resolve(pageModel);
            }).catch((reason: any) => {
                deferred.reject(reason);
            }).done();
        } else {
            deferred.resolve(pageModel);
        }

        return deferred.promise;
    }
}
