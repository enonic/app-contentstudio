import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {WidgetItemView} from '../../WidgetItemView';
import {DefaultModels} from '../../../../wizard/page/DefaultModels';
import {DefaultModelsFactory, DefaultModelsFactoryConfig} from '../../../../wizard/page/DefaultModelsFactory';
import {GetPageTemplateByKeyRequest} from '../../../../resource/GetPageTemplateByKeyRequest';
import {ContentQueryRequest} from '../../../../resource/ContentQueryRequest';
import {GetNearestSiteRequest} from '../../../../resource/GetNearestSiteRequest';
import {GetContentByIdRequest} from '../../../../resource/GetContentByIdRequest';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {Content} from '../../../../content/Content';
import {PageTemplate} from '../../../../content/PageTemplate';
import {Site} from '../../../../content/Site';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../../../../content/ContentQuery';
import {PageMode} from '../../../../page/PageMode';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {ContentIds} from '../../../../ContentIds';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../resource/ContentSummaryAndCompareStatusFetcher';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentServerChangeItem} from '../../../../event/ContentServerChangeItem';
import {GetComponentDescriptorRequest} from '../../../../resource/GetComponentDescriptorRequest';
import {Descriptor} from '../../../../page/Descriptor';

export class PageTemplateWidgetItemView
    extends WidgetItemView {

    private content: ContentSummary;

    private pageTemplateViewer: PageTemplateViewer;

    public static debug: boolean = false;

    constructor() {
        super('page-template-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        const content = item.getContentSummary();
        if (!content.equals(this.content)) {
            if (!this.content) {
                this.initListeners();
            }
            this.content = content;

            return this.loadPageTemplate().then(() => this.layout());
        }

        return Q<any>(null);
    }

    private initListeners() {

        const onContentPermissionsUpdated = (contentIds: ContentIds) => {
            const thisContentId: ContentId = this.content.getContentId();
            const isThisContentUpdated: boolean = contentIds.contains(thisContentId);

            if (!isThisContentUpdated) {
                return;
            }

            ContentSummaryAndCompareStatusFetcher.fetch(this.content.getContentId())
                .then(this.setContentAndUpdateView.bind(this))
                .catch(DefaultErrorHandler.handle);

        };

        const onContentUpdated = (contents: ContentSummaryAndCompareStatus[]) => {
            const thisContentId = this.content.getId();

            const contentSummary: ContentSummaryAndCompareStatus = contents.filter((content) => {
                return thisContentId === content.getId();
            })[0];

            if (contentSummary) {
                this.setContentAndUpdateView(contentSummary);
            } else if (contents.some(content => content.getContentSummary().isPageTemplate())) {
                this.loadPageTemplate().then(() => this.layout());
            }
        };

        const onContentDeleted = (deletedPaths: ContentServerChangeItem[]) => {
            if (!this.pageTemplateViewer || !this.pageTemplateViewer.hasPageTemplate()) {
                return;
            }

            const pageTemplateContentId: ContentId = this.pageTemplateViewer.getPageTemplate().getContentId();
            const isPageTemplateDeleted = deletedPaths.some((path: ContentServerChangeItem) => {
                return path.getContentId().equals(pageTemplateContentId);
            });

            if (isPageTemplateDeleted) {
                this.loadPageTemplate().then(() => this.layout());
            }
        };

        const serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentUpdated(onContentUpdated);
        serverEvents.onContentPermissionsUpdated(onContentPermissionsUpdated);
        serverEvents.onContentDeleted(onContentDeleted);
    }

    public layout(): Q.Promise<any> {
        if (PageTemplateWidgetItemView.debug) {
            console.debug('PageTemplateWidgetItemView.layout');
        }

        return super.layout().then(() => {
            this.removeChildren();
            if (this.pageTemplateViewer) {
                this.appendChild(this.pageTemplateViewer.render());
            }
        });
    }

    private getPageTemplateInfo(content: Content): Q.Promise<PageTemplateViewer> {
        const pageTemplateViewer = new PageTemplateViewer();

        if (content.getType().isFragment()) {
            pageTemplateViewer.setPageMode(PageMode.FRAGMENT);
            return Q(pageTemplateViewer);
        }

        if (content.isPage()) {

            if (content.getPage().hasTemplate()) {
                pageTemplateViewer.setPageMode(PageMode.FORCED_TEMPLATE);

                return new GetPageTemplateByKeyRequest(content.getPage().getTemplate()).sendAndParse()
                    .then(
                        (pageTemplate: PageTemplate) => {
                            pageTemplateViewer.setPageTemplate(pageTemplate);

                            return Q(pageTemplateViewer);
                        }, reason => {
                            return this.tryToSetAutomaticMode(pageTemplateViewer);
                        });
            }

            pageTemplateViewer.setPageMode(PageMode.FORCED_CONTROLLER);

            return new GetComponentDescriptorRequest(content.getPage().getController().toString()).sendAndParse()
                .then((pageDescriptor: Descriptor) => {
                    pageTemplateViewer.setPageController(pageDescriptor);
                    pageTemplateViewer.setContent(this.content);

                    return Q(pageTemplateViewer);
                });
        }

        return this.tryToSetAutomaticMode(pageTemplateViewer);
    }

    private tryToSetAutomaticMode(pageTemplateViewer: PageTemplateViewer): Q.Promise<PageTemplateViewer> {
        return new GetNearestSiteRequest(this.content.getContentId()).sendAndParse().then((site: Site) => {

            return this.loadDefaultModels(site, this.content.getType()).then((defaultModels: DefaultModels) => {

                if (defaultModels && defaultModels.hasPageTemplate()) {
                    pageTemplateViewer.setPageMode(PageMode.AUTOMATIC);
                    pageTemplateViewer.setPageTemplate(defaultModels.getPageTemplate());
                }

                return Q<PageTemplateViewer>(pageTemplateViewer);
            });
        });
    }

    private loadDefaultModels(site: Site, contentType: ContentTypeName): Q.Promise<DefaultModels> {

        if (site) {
            return DefaultModelsFactory.create(<DefaultModelsFactoryConfig>{
                siteId: site.getContentId(),
                contentType: contentType,
                applications: site.getApplicationKeys()
            });
        }

        if (contentType.isSite()) {
            return Q<DefaultModels>(new DefaultModels(null, null));
        }

        return Q<DefaultModels>(null);
    }

    private loadPageTemplate(): Q.Promise<void> {
        this.pageTemplateViewer = null;

        return new GetContentByIdRequest(this.content.getContentId()).sendAndParse().then((content: Content) => {
            return this.getPageTemplateInfo(content).then((pageTemplateViewer: PageTemplateViewer) => {
                this.pageTemplateViewer = pageTemplateViewer;
            });
        });
    }
}

class PageTemplateViewer {
    private pageMode: PageMode;
    private pageTemplate: PageTemplate;
    private pageController: Descriptor;
    private content: ContentSummary;

    constructor() {
        this.setPageMode(PageMode.NO_CONTROLLER);
    }

    setPageMode(pageMode: PageMode) {
        this.pageMode = pageMode;
    }

    setPageTemplate(pageTemplate: PageTemplate) {
        this.pageTemplate = pageTemplate;
    }

    hasPageTemplate(): boolean {
        return !!this.pageTemplate;
    }

    getPageTemplate(): PageTemplate {
        return this.pageTemplate;
    }

    setPageController(pageController: Descriptor) {
        this.pageController = pageController;
    }

    setContent(content: ContentSummary) {
        this.content = content;
    }

    private getPageModeString(): string {
        switch (this.pageMode) {
        case PageMode.AUTOMATIC:
            return i18n('widget.pagetemplate.automatic');
        case PageMode.FORCED_CONTROLLER:
            return i18n('widget.pagetemplate.forcedcontroller');
        case PageMode.FORCED_TEMPLATE:
            return i18n('widget.pagetemplate.forcedtemplate');
        case PageMode.FRAGMENT:
            return i18n('widget.pagetemplate.fragment');
        default:
            return i18n('widget.pagetemplate.default');
        }
    }

    private isRenderable(): boolean {
        return this.pageMode !== PageMode.NO_CONTROLLER;
    }

    private getPageTemplateLinkEl(): AEl {
        const pageTemplateEl = new AEl();
        pageTemplateEl.setHtml(this.pageTemplate.getDisplayName());
        pageTemplateEl.setTitle(this.pageTemplate.getPath().toString());

        pageTemplateEl.onClicked(() => {
            new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(this.pageTemplate)]).fire();
        });

        return pageTemplateEl;
    }

    private getEmptyDescriptorEl(): SpanEl {
        const emptyEl = new SpanEl();

        emptyEl.setHtml(i18n('widget.pagetemplate.notfound'));
        return emptyEl;
    }

    private getDescriptorEl(): Element {

        if (!(this.pageTemplate || this.pageController)) {
            return this.getEmptyDescriptorEl();
        }

        if (this.pageTemplate) {
            return this.getPageTemplateLinkEl();
        }

        const spanEl = new SpanEl();
        spanEl.setHtml(this.pageController.getDisplayName());
        spanEl.getEl().setTitle(this.pageController.getKey().toString());

        return spanEl;
    }

    render(): DivEl {
        const divEl = new DivEl('page-template-viewer');

        if (!this.isRenderable()) {
            const noTemplateText = new PEl('no-template');
            noTemplateText.setHtml(this.getPageModeString());

            divEl.appendChild(noTemplateText);

            return divEl;
        }

        const pageTemplateView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        const isPageTemplate = this.content && this.content.isPageTemplate();

        if (!isPageTemplate) {
            pageTemplateView.setMainName(this.getPageModeString());
        } else {
            pageTemplateView.setMainName(this.content.getDisplayName());
        }

        if (this.pageMode === PageMode.FRAGMENT) {
            pageTemplateView.setIconClass(StyleHelper.getCommonIconCls('fragment'));
        } else if (isPageTemplate) {
            this.fillPageTemplateInfo(pageTemplateView);

        } else {
            const descriptorEl = this.getDescriptorEl();
            if (descriptorEl) {
                pageTemplateView.setSubNameElements([descriptorEl]);
            }
            if (this.pageMode === PageMode.AUTOMATIC) {
                pageTemplateView.setIconClass('icon-wand');
            } else if (this.pageMode === PageMode.FORCED_TEMPLATE) {
                pageTemplateView.setIconClass('icon-page-template');
            } else if (this.pageMode === PageMode.FORCED_CONTROLLER) {
                pageTemplateView.setIconClass('icon-cog');
            }
        }

        divEl.appendChildren(pageTemplateView);

        return divEl;
    }

    private fillPageTemplateInfo(pageTemplateView: NamesAndIconView) {
        pageTemplateView.setIconClass('icon-page-template');

        const contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setQueryExpr(new QueryExpr(CompareExpr.eq(new FieldExpr('page.template'),
            ValueExpr.string(this.content.getId()))));

        new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then((result) => {
            if (result.getMetadata().getHits() === 0) {
                pageTemplateView.setSubName(i18n('widget.pagetemplate.notused'));
            }

            const descriptors = result.getContents().map(contentSummary => {
                const aEl = new AEl();
                aEl.setHtml(contentSummary.getDisplayName());

                aEl.onClicked(() => {
                    new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(contentSummary)]).fire();
                });

                return aEl;
            });

            pageTemplateView.setSubNameElements(descriptors);
        });
    }
}
