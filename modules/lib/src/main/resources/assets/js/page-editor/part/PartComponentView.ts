import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {PartItemType} from './PartItemType';
import {ContentView, ContentViewBuilder} from '../ContentView';
import {PartComponentViewer} from './PartComponentViewer';
import {PartPlaceholder} from './PartPlaceholder';
import {ItemView} from '../ItemView';
import {ItemType} from '../ItemType';
import {ContentItemType} from '../ContentItemType';
import {DragAndDrop} from '../DragAndDrop';
import {PartComponent} from '../../app/page/region/PartComponent';

export class PartComponentViewBuilder
    extends ComponentViewBuilder<PartComponent> {

    constructor() {
        super();
        this.setType(PartItemType.get());
    }
}

export class PartComponentView
    extends ComponentView<PartComponent> {

    constructor(builder: PartComponentViewBuilder) {
        super(builder.setViewer(new PartComponentViewer()).setInspectActionRequired(true));

        this.createPlaceholder();

        this.liveEditModel = builder.parentRegionView.getLiveEditModel();

        this.resetHrefForRootLink(builder);

        this.disableLinks();
    }

    private createPlaceholder() {
        let placeholder = new PartPlaceholder(this);
        placeholder.setDisplayName(this.getComponent().getName().toString());

        this.setPlaceholder(placeholder);

    }

    private resetHrefForRootLink(builder: PartComponentViewBuilder) {
        if (builder.element && builder.element.getEl().hasAttribute('href')) {
            builder.element.getEl().setAttribute('href', '#');
        }
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    isEmpty(): boolean {
        return !this.getComponent() || this.getComponent().isEmpty();
    }
}
