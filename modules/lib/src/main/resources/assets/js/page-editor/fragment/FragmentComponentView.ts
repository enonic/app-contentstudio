import {ContentBasedComponentView} from '../ContentBasedComponentView';
import {FragmentItemType} from './FragmentItemType';
import {FragmentPlaceholder} from './FragmentPlaceholder';
import {ItemType} from '../ItemType';
import {LayoutItemType} from '../layout/LayoutItemType';
import {TextItemType} from '../text/TextItemType';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentId} from '../../app/content/ContentId';
import {DetachFragmentEvent} from '../event/outgoing/manipulation/DetachFragmentEvent';
import {ComponentViewBuilder} from '../ComponentView';

export class FragmentComponentViewBuilder
    extends ComponentViewBuilder {

    constructor() {
        super();
        this.setType(FragmentItemType.get());
    }
}

export class FragmentComponentView
    extends ContentBasedComponentView {

    private static ERROR_ATTRIBUTE = 'data-portal-placeholder-error';

    private fragmentContainsLayout: boolean;

    private detachAction: Action;

    constructor(builder: FragmentComponentViewBuilder) {
        super(builder.setInspectActionRequired(true).setPlaceholder(new FragmentPlaceholder()));

        this.fragmentContainsLayout = false;
        (this.placeholder as FragmentPlaceholder).setComponentView(this);
        this.disableLinks();

        this.parseFragmentComponents(this);
        this.handleErrors();
    }


    containsLayout(): boolean {
        return this.fragmentContainsLayout;
    }

    protected addComponentContextMenuActions(inspectActionRequired: boolean) {
        super.addComponentContextMenuActions(inspectActionRequired);

        if (!this.empty) {
            this.addCustomizeAction();
        }
    }

    private addCustomizeAction() {
        const actions: Action[] = [];

        this.detachAction = new Action(i18n('live.view.customize')).onExecuted(() => {
            this.deselect();

            new DetachFragmentEvent(this.getPath()).fire();
        });

        actions.push(this.detachAction);

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
        const hasErrors: boolean = !!htmlElement.getAttribute(FragmentComponentView.ERROR_ATTRIBUTE);

        if (hasErrors) {
            this.getEl().setAttribute(FragmentComponentView.ERROR_ATTRIBUTE, 'true');
        }

        htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_TYPE);
        htmlElement.removeAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
    }

    private handleErrors(): void {
        if (this.getEl().hasAttribute(FragmentComponentView.ERROR_ATTRIBUTE)) {
            this.detachAction?.setEnabled(false);
            this.editAction?.setEnabled(false);
        }
    }

    private convertTextComponentImageUrls(element: Element) {
        const id = this.getContentId();
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
