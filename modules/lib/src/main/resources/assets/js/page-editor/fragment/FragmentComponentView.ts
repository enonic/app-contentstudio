import {ContentBasedComponentView, ContentBasedComponentViewBuilder} from '../ContentBasedComponentView';
import {FragmentItemType} from './FragmentItemType';
import {FragmentComponentLoadedEvent} from '../FragmentComponentLoadedEvent';
import {FragmentLoadErrorEvent} from '../FragmentLoadErrorEvent';
import {FragmentPlaceholder} from './FragmentPlaceholder';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {ItemType} from '../ItemType';
import {LayoutItemType} from '../layout/LayoutItemType';
import {TextItemType} from '../text/TextItemType';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {Content} from '../../app/content/Content';
import {Component} from '../../app/page/region/Component';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentId} from '../../app/content/ContentId';
import * as Q from 'q';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {PageHelper} from '../../app/util/PageHelper';
import {DetachFragmentEvent} from '../event/outgoing/manipulation/DetachFragmentEvent';
import {ContentContext} from '../../app/wizard/ContentContext';
import {ContentSummary} from '../../app/content/ContentSummary';
import {PageItem} from '../../app/page/region/PageItem';
import {FragmentComponent} from '../../app/page/region/FragmentComponent';
import {ItemViewAddedEvent} from '../ItemViewAddedEvent';

export class FragmentComponentViewBuilder
    extends ContentBasedComponentViewBuilder {

    fragmentContentId: ContentId;

    constructor() {
        super();
        this.setType(FragmentItemType.get());
        this.setContentTypeName(ContentTypeName.FRAGMENT);
    }
}

export class FragmentComponentView
    extends ContentBasedComponentView {

    private fragmentContainsLayout: boolean;

    constructor(builder: FragmentComponentViewBuilder) {
        super(builder.setInspectActionRequired(true));

        this.fragmentContainsLayout = false;
        this.setPlaceholder(new FragmentPlaceholder(this));
        this.disableLinks();
    }

    protected initListeners() {
        super.initListeners();

        // parsing fragment after it was registered in a parent region, so it has a path
        const thisItemAddedListener = (event: ItemViewAddedEvent) => {
            if (event.getView() === this) {
                this.getParentItemView().unItemViewAdded(thisItemAddedListener);
                this.parseFragmentComponents(this);
            }
        };

        this.getParentItemView().onItemViewAdded(thisItemAddedListener);
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

            new DetachFragmentEvent(this.getPath()).fire();
        }));

        this.addContextMenuActions(actions);
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
            this.convertTextComponentImageUrls(element);
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
        const id = this.liveEditParams.getFragmentIdByPath(this.getPath().toString());
        const contentId = id ? new ContentId(id) : null;

        if (contentId) {
            this.processTextElement(element, contentId);
        } else {
            console.warn('Could not process text component in a fragment, unable to find content id for fragment: ' + this.getPath());
        }
    }

    private processTextElement(element: Element, contentId: ContentId): void {
        const text = HTMLAreaHelper.convertRenderSrcToPreviewSrc(element.getHtml(), contentId.toString());
        element.setHtml(text, false);
    }
}
