import {ContentBasedComponentView, ContentBasedComponentViewBuilder} from '../ContentBasedComponentView';
import {FragmentItemType} from './FragmentItemType';
import {FragmentComponentViewer} from './FragmentComponentViewer';
import {FragmentComponentLoadedEvent} from '../FragmentComponentLoadedEvent';
import {FragmentLoadErrorEvent} from '../FragmentLoadErrorEvent';
import {FragmentPlaceholder} from './FragmentPlaceholder';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {FragmentComponentReloadRequiredEvent} from '../FragmentComponentReloadRequiredEvent';
import {ItemType} from '../ItemType';
import {LayoutItemType} from '../layout/LayoutItemType';
import {TextItemType} from '../text/TextItemType';
import {CreateItemViewConfig} from '../CreateItemViewConfig';
import {RegionView} from '../RegionView';
import {ComponentView} from '../ComponentView';
import {ComponentDetachedFromFragmentEvent} from '../ComponentDetachedFromFragmentEvent';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {ContentDeletedEvent, ContentDeletedItem} from '../../app/event/ContentDeletedEvent';
import {ContentUpdatedEvent} from '../../app/event/ContentUpdatedEvent';
import {Content} from '../../app/content/Content';
import {FragmentComponent} from '../../app/page/region/FragmentComponent';
import {ComponentType} from '../../app/page/region/ComponentType';
import {ComponentPropertyValueChangedEvent} from '../../app/page/region/ComponentPropertyValueChangedEvent';
import {Component} from '../../app/page/region/Component';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Element} from 'lib-admin-ui/dom/Element';
import {Action} from 'lib-admin-ui/ui/Action';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ContentId} from '../../app/content/ContentId';

export class FragmentComponentViewBuilder
    extends ContentBasedComponentViewBuilder<FragmentComponent> {

    constructor() {
        super();
        this.setType(FragmentItemType.get());
        this.setContentTypeName(ContentTypeName.FRAGMENT);
    }
}

export class FragmentComponentView
    extends ContentBasedComponentView<FragmentComponent> {

    private fragmentContainsLayout: boolean;

    private fragmentContent: Content;

    private fragmentContentLoadedListeners: { (event: FragmentComponentLoadedEvent): void }[];

    private fragmentLoadErrorListeners: { (event: FragmentLoadErrorEvent): void }[];

    private loaded: boolean = false;

    constructor(builder: FragmentComponentViewBuilder) {

        super(<FragmentComponentViewBuilder>builder.setViewer(new FragmentComponentViewer()).setInspectActionRequired(true));

        this.liveEditModel = builder.parentRegionView.getLiveEditModel();
        this.fragmentContainsLayout = false;
        this.fragmentContent = null;
        this.fragmentContentLoadedListeners = [];
        this.fragmentLoadErrorListeners = [];

        this.setPlaceholder(new FragmentPlaceholder(this));

        this.component.onPropertyValueChanged((e: ComponentPropertyValueChangedEvent) => {
            if (e.getPropertyName() === FragmentComponent.PROPERTY_FRAGMENT) {
                this.loadFragmentContent();
            }
        });
        this.loadFragmentContent();

        if (this.isTextComponent(this)) {
            this.doParseFragmentComponents(this, TextItemType.get());
        } else {
            this.parseFragmentComponents(this);
        }

        this.disableLinks();

        this.handleContentRemovedEvent();
        this.handleContentUpdatedEvent();
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

    private handleContentRemovedEvent() {
        let contentDeletedListener = (event) => {
            let deleted = event.getDeletedItems().some((deletedItem: ContentDeletedItem) => {
                return !deletedItem.isPending() && deletedItem.getContentId().equals(this.component.getFragment());
            });
            if (deleted) {
                this.notifyFragmentLoadError();
                new ShowWarningLiveEditEvent(i18n('live.view.fragment.notavailable', this.component.getFragment())).fire();
                this.convertToBrokenFragmentView();
            }
        };

        ContentDeletedEvent.on(contentDeletedListener);

        this.onRemoved((event) => {
            ContentDeletedEvent.un(contentDeletedListener);
        });
    }

    private handleContentUpdatedEvent() {
        let contentUpdatedListener = (event: ContentUpdatedEvent) => {
            const fragmentId = this.component ? this.component.getFragment() : null;

            if (fragmentId && fragmentId.equals(event.getContentId())) {
                new FragmentComponentReloadRequiredEvent(this).fire();
            }
        };

        ContentUpdatedEvent.on(contentUpdatedListener);

        this.onRemoved(() => {
            ContentUpdatedEvent.un(contentUpdatedListener);
        });
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

        if (this.component && this.component.getFragment()) {
            this.addDetachAction();
        }
    }

    private addDetachAction() {
        const actions: Action[] = [];

        actions.push(new Action(i18n('live.view.detach')).onExecuted(() => {

            this.deselect();

            const regionView = this.getRegionView();

            const index = regionView.getComponentViewIndex(this);

            const component = this.getFragmentRootComponent();
            const componentType = this.getFragmentRootType();

            const componentView = <ComponentView<any>>this.createView(
                ItemType.fromComponentType(componentType),
                new CreateItemViewConfig<RegionView, Component>()
                    .setData(component)
                    .setPositionIndex(index)
                    .setParentView(regionView)
                    .setParentElement(regionView));

            this.addComponentView(componentView, index);
            this.remove();

            new ComponentDetachedFromFragmentEvent(componentView, component.getType()).fire();

        }));

        this.addContextMenuActions(actions);
    }

    getFragmentRootComponent(): Component {
        if (this.fragmentContent) {
            let page = this.fragmentContent.getPage();
            if (page) {
                return page.getFragment();
            }
        }
        return null;
    }

    getFragmentDisplayName(): string {
        if (this.fragmentContent) {
            return this.fragmentContent.getDisplayName();
        }

        if (this.component) {
            return this.component.getName().toString();
        }

        return null;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    private loadFragmentContent() {
        const contentId = this.component.getFragment();
        if (contentId) {
            if (!this.fragmentContent || !contentId.equals(this.fragmentContent.getContentId())) {
                new GetContentByIdRequest(contentId).sendAndParse().then((content: Content) => {
                    this.fragmentContent = content;
                    this.notifyFragmentContentLoaded();
                    new FragmentComponentLoadedEvent(this).fire();
                }).catch((reason: any) => {
                    this.fragmentContent = null;
                    this.notifyFragmentContentLoaded();
                    this.notifyFragmentLoadError();
                    new ShowWarningLiveEditEvent(i18n('live.view.fragment.notfoundid', contentId)).fire();
                }).done();
            }
        } else {
            this.fragmentContent = null;
            this.notifyFragmentContentLoaded();
        }
    }

    private parseFragmentComponents(parentElement: Element, parentType?: ItemType) {
        parentElement.getChildren().forEach((childElement: Element) => this.doParseFragmentComponents(childElement, parentType));
    }

    private doParseFragmentComponents(element: Element, parentType?: ItemType) {
        const itemType = ItemType.fromElement(element);
        if (itemType) {
            // remove component-type attributes to avoid inner components of fragment to be affected by d&d sorting
            this.removeComponentTypeAttrs(element);

            if (LayoutItemType.get().equals(itemType)) {
                this.fragmentContainsLayout = true;
            }
        }

        if (this.isTextComponentSection(element, parentType)) {
            this.convertTextComponentImageUrls(element);
        } else {
            this.parseFragmentComponents(element, itemType);
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

    private isTextComponentSection(element: Element, parentType: ItemType): boolean {
        const isTextComponent = TextItemType.get().equals(parentType);
        const isSection = element.getEl().getTagName().toUpperCase() === 'SECTION';
        const contentId: ContentId = this.component.getFragment();

        return contentId && isTextComponent && isSection;
    }

    private convertTextComponentImageUrls(element: Element) {
        const text = HTMLAreaHelper.convertRenderSrcToPreviewSrc(element.getHtml(), this.component.getFragment().toString());
        element.setHtml(text, false);
    }

    private isTextComponent(element: Element): boolean {
        const itemType = ItemType.fromElement(element);

        return !!itemType && TextItemType.get().equals(itemType);
    }

    getContentId(): ContentId {
        return this.component ? this.component.getFragment() : null;
    }

    onFragmentContentLoaded(listener: (event: FragmentComponentLoadedEvent) => void) {
        this.fragmentContentLoadedListeners.push(listener);
    }

    unFragmentContentLoaded(listener: (event: FragmentComponentLoadedEvent) => void) {
        this.fragmentContentLoadedListeners = this.fragmentContentLoadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyFragmentContentLoaded() {
        this.loaded = true;

        let event = new FragmentComponentLoadedEvent(this);
        this.fragmentContentLoadedListeners.forEach((listener) => {
            listener(event);
        });
    }

    onFragmentLoadError(listener: (event: FragmentLoadErrorEvent) => void) {
        this.fragmentLoadErrorListeners.push(listener);
    }

    unFragmentLoadError(listener: (event: FragmentLoadErrorEvent) => void) {
        this.fragmentLoadErrorListeners = this.fragmentLoadErrorListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyFragmentLoadError() {
        let event = new FragmentLoadErrorEvent(this);
        this.fragmentLoadErrorListeners.forEach((listener) => {
            listener(event);
        });
    }
}
