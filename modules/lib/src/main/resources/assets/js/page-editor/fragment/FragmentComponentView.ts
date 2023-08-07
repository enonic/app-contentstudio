import {ContentBasedComponentView, ContentBasedComponentViewBuilder} from '../ContentBasedComponentView';
import {FragmentItemType} from './FragmentItemType';
import {FragmentComponentLoadedEvent} from '../FragmentComponentLoadedEvent';
import {FragmentLoadErrorEvent} from '../FragmentLoadErrorEvent';
import {FragmentPlaceholder} from './FragmentPlaceholder';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {ItemType} from '../ItemType';
import {LayoutItemType} from '../layout/LayoutItemType';
import {TextItemType} from '../text/TextItemType';
import {CreateItemViewConfig} from '../CreateItemViewConfig';
import {RegionView} from '../RegionView';
import {ComponentView} from '../ComponentView';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {Content} from '../../app/content/Content';
import {FragmentComponent} from '../../app/page/region/FragmentComponent';
import {ComponentType} from '../../app/page/region/ComponentType';
import {Component} from '../../app/page/region/Component';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ContentId} from '../../app/content/ContentId';
import * as Q from 'q';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {PageHelper} from '../../app/util/PageHelper';

export class FragmentComponentViewBuilder
    extends ContentBasedComponentViewBuilder {

    constructor() {
        super();
        this.setType(FragmentItemType.get());
        this.setContentTypeName(ContentTypeName.FRAGMENT);
    }
}

export class FragmentComponentView
    extends ContentBasedComponentView {

    private fragmentContainsLayout: boolean;

    private fragmentContent?: Content;

    private loaded: boolean = false;

    private fragmentContentId?: ContentId;

    constructor(builder: FragmentComponentViewBuilder) {
        super(builder.setInspectActionRequired(true));

        this.fragmentContainsLayout = false;
        this.fragmentContent = null;

        this.setPlaceholder(new FragmentPlaceholder(this));

        this.loadFragmentContent();

        this.parseFragmentComponents(this);

        this.disableLinks();
    }

    getFragmentRootType(): ComponentType {
        if (this.fragmentContent) {
            let page = this.fragmentContent.getPage();
            if (page) {
                return page.getFragment().getType();
            }
        }
        return null;
    }

    private convertToBrokenFragmentView() {
        this.getEl().setAttribute('data-portal-placeholder', 'true');
        this.getEl().setAttribute('data-portal-placeholder-error', 'true');
        this.removeChild(this.getFirstChild());
        let errorSpan = new SpanEl('data-portal-placeholder-error');
        errorSpan.setHtml(i18n('live.view.fragment.notfound'));
        this.prependChild(errorSpan);
    }

    containsLayout(): boolean {
        return this.fragmentContainsLayout;
    }

    protected addComponentContextMenuActions(inspectActionRequired: boolean) {

        super.addComponentContextMenuActions(inspectActionRequired);

        if (!this.empty) {
            this.addDetachAction();
        }
    }

    private addDetachAction() {
        const actions: Action[] = [];

        actions.push(new Action(i18n('live.view.detach')).onExecuted(() => {

            this.deselect();

            const regionView = this.getRegionView();

            const index = regionView.getComponentViewIndex(this);

            const componentType = this.getFragmentRootType();

            const componentView = this.createView(
                ItemType.fromComponentType(componentType),
                new CreateItemViewConfig<RegionView>()
                    .setPositionIndex(index)
                    .setParentView(regionView)
                    .setParentElement(regionView)) as ComponentView;

            this.addComponentView(componentView, index);
            this.remove();
        }));

        this.addContextMenuActions(actions);
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    private loadFragmentContent(): void {
        if (this.fragmentContentId) {
            if (!this.fragmentContent || !this.fragmentContentId.equals(this.fragmentContent.getContentId())) {
                this.fetchFragmentContent(this.fragmentContentId).then((content: Content): void => {
                    this.fragmentContent = content;
                    this.notifyFragmentContentLoaded();
                    new FragmentComponentLoadedEvent(this).fire();
                }).catch((reason) => {
                    this.fragmentContent = null;
                    this.notifyFragmentContentLoaded();
                    this.notifyFragmentLoadError();
                    new ShowWarningLiveEditEvent(i18n('live.view.fragment.notfoundid', this.fragmentContentId)).fire();
                }).done();
            }
        } else {
            this.fragmentContent = null;
            this.notifyFragmentContentLoaded();
        }
    }

    private fetchFragmentContent(contentId: ContentId): Q.Promise<Content> {
        return new GetContentByIdRequest(contentId).sendAndParse().then((content: Content) => {
            const component: Component = content.getPage()?.getFragment();
            const injectPromise: Q.Promise<void> = this.isLayoutComponent(component)
                                  ? PageHelper.fetchAndInjectLayoutRegions(component as LayoutComponent)
                                  : Q.resolve();

            return injectPromise.then(() => content);
        });
    }

    private isLayoutComponent(component: Component): boolean {
        return !!component && component instanceof LayoutComponent && !!component.getDescriptorKey();
    }

    private parseFragmentComponents(parentElement: Element) {
        parentElement.getChildren().forEach((childElement: Element) => this.doParseFragmentComponents(childElement));
    }

    private doParseFragmentComponents(element: Element) {
        const itemType = ItemType.fromElement(element);
        if (itemType) {
            // remove component-type attributes to avoid inner components of fragment to be affected by d&d sorting
            this.removeComponentTypeAttrs(element);

            if (LayoutItemType.get().equals(itemType)) {
                this.fragmentContainsLayout = true;
            }
        }

        if (TextItemType.get().equals(itemType)) {
           // this.convertTextComponentImageUrls(element);
        } else {
            this.parseFragmentComponents(element);
        }
    }

    private removeComponentTypeAttrs(element: Element) {
        const htmlElement: HTMLElement = element.getHTMLElement();
        const hasErrors: boolean = !!htmlElement.getAttribute('data-portal-placeholder-error');

        if (hasErrors) {
            this.getEl().setAttribute('data-portal-placeholder-error', 'true');
        }

        htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_TYPE);
        htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
    }

    private convertTextComponentImageUrls(element: Element) {
        const text = HTMLAreaHelper.convertRenderSrcToPreviewSrc(element.getHtml(), this.fragmentContentId.toString());
        element.setHtml(text, false);
    }

    private notifyFragmentContentLoaded() {
        //
    }

    private notifyFragmentLoadError() {
         new FragmentLoadErrorEvent(this).fire();
    }
}
