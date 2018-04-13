import './../api.ts';
import {ItemView, ItemViewBuilder} from './ItemView';
import {PartComponentView} from './part/PartComponentView';
import {ContentItemType} from './ContentItemType';
import {ContentViewContextMenuTitle} from './ContentViewContextMenuTitle';

export class ContentViewBuilder {

    parentPartComponentView: PartComponentView;

    parentElement: api.dom.Element;

    element: api.dom.Element;

    setParentPartComponentView(value: PartComponentView): ContentViewBuilder {
        this.parentPartComponentView = value;
        return this;
    }

    setParentElement(value: api.dom.Element): ContentViewBuilder {
        this.parentElement = value;
        return this;
    }

    setElement(value: api.dom.Element): ContentViewBuilder {
        this.element = value;
        return this;
    }

}

// TODO:
export class ContentView
    extends ItemView {

    private parentPartComponentView: PartComponentView;

    constructor(builder: ContentViewBuilder) {

        super(new ItemViewBuilder().setItemViewIdProducer(builder.parentPartComponentView.getItemViewIdProducer()).setType(
            ContentItemType.get()).setElement(builder.element).setParentElement(builder.parentElement).setParentView(
            builder.parentPartComponentView));

        this.parentPartComponentView = builder.parentPartComponentView;

        this.setContextMenuTitle(new ContentViewContextMenuTitle(this));

    }

    isEmpty(): boolean {
        return false;
    }

    getParentItemView(): PartComponentView {
        return this.parentPartComponentView;
    }

    setParentItemView(partView: PartComponentView) {
        super.setParentItemView(partView);
        this.parentPartComponentView = partView;
    }
}
