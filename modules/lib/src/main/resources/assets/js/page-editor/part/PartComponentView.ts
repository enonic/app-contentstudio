import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {PartItemType} from './PartItemType';
import {PartPlaceholder} from './PartPlaceholder';
import {DragAndDrop} from '../DragAndDrop';
import {PartComponent} from '../../app/page/region/PartComponent';

export class PartComponentViewBuilder
    extends ComponentViewBuilder {

    constructor() {
        super();
        this.setType(PartItemType.get());
    }
}

export class PartComponentView
    extends ComponentView {

    constructor(builder: PartComponentViewBuilder) {
        super(builder.setInspectActionRequired(true));

        this.createPlaceholder();
        this.resetHrefForRootLink(builder);
        this.disableLinks();
    }

    private createPlaceholder() {
        this.setPlaceholder(new PartPlaceholder(this));
    }

    private resetHrefForRootLink(builder: PartComponentViewBuilder) {
        if (builder.element && builder.element.getEl().hasAttribute('href')) {
            builder.element.getEl().setAttribute('href', '#');
        }
    }
}
