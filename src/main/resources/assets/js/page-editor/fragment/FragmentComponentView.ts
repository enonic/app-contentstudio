import './../../api.ts';
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
import FragmentComponent = api.content.page.region.FragmentComponent;
import GetContentByIdRequest = api.content.resource.GetContentByIdRequest;
import Content = api.content.Content;
import ContentDeletedEvent = api.content.event.ContentDeletedEvent;
import ContentUpdatedEvent = api.content.event.ContentUpdatedEvent;
import HTMLAreaHelper = api.util.htmlarea.editor.HTMLAreaHelper;
import ContentTypeName = api.schema.content.ContentTypeName;
import i18n = api.util.i18n;
import ComponentType = api.content.page.region.ComponentType;
import Component = api.content.page.region.Component;

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

        this.component.onPropertyValueChanged((e: api.content.page.region.ComponentPropertyValueChangedEvent) => {
            if (e.getPropertyName() === FragmentComponent.PROPERTY_FRAGMENT) {
                this.loadFragmentContent();
            }
        });
        this.loadFragmentContent();

        this.parseContentViews(this);
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
            let deleted = event.getDeletedItems().some((deletedItem: api.content.event.ContentDeletedItem) => {
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

        this.onRemoved((event) => {
            ContentUpdatedEvent.un(contentUpdatedListener);
        });
    }

    private convertToBrokenFragmentView() {
        this.getEl().setAttribute('data-portal-placeholder', 'true');
        this.getEl().setAttribute('data-portal-placeholder-error', 'true');
        this.removeChild(this.getFirstChild());
        let errorSpan = new api.dom.SpanEl('data-portal-placeholder-error');
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
        const actions: api.ui.Action[] = [];

        actions.push(new api.ui.Action(i18n('live.view.detach')).onExecuted(() => {

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

            this.addComponentView(<ComponentView<any>>componentView, index);
            this.remove();

            new ComponentDetachedFromFragmentEvent(componentView, component.getType()).fire();

        }));

        this.addContextMenuActions(actions);
    }

    getFragmentRootComponent(): api.content.page.region.Component {
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
        let contentId = this.component.getFragment();
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

    private parseContentViews(parentElement?: api.dom.Element, parentType?: ItemType) {
        let children = parentElement.getChildren();
        children.forEach((childElement: api.dom.Element) => {
            let itemType = ItemType.fromElement(childElement);
            if (itemType) {
                if (LayoutItemType.get().equals(itemType)) {
                    this.fragmentContainsLayout = true;
                }

                // remove component-type attributes to avoid inner components of fragment to be affected by d&d sorting
                let htmlElement = childElement.getHTMLElement();
                let hasErrors = !!htmlElement.getAttribute('data-portal-placeholder-error');
                if (hasErrors) {
                    this.getEl().setAttribute('data-portal-placeholder-error', 'true');
                }

                htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_TYPE);
                htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
            }

            let isTextComponent = TextItemType.get().equals(parentType);
            if (isTextComponent && childElement.getEl().getTagName().toUpperCase() === 'SECTION') {
                // convert image urls in text component for web
                childElement.setHtml(HTMLAreaHelper.prepareImgSrcsInValueForEdit(childElement.getHtml()), false);
                return;
            }
            this.parseContentViews(childElement, itemType);
        });
    }

    getContentId(): api.content.ContentId {
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
