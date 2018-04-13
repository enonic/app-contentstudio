import './../api.ts';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemView} from './ItemView';
import {ItemViewFactory} from './ItemViewFactory';
import {RegionView} from './RegionView';
import Content = api.content.Content;
import ComponentType = api.content.page.region.ComponentType;
import FragmentComponent = api.content.page.region.FragmentComponent;

export class CreateItemViewConfig<PARENT extends ItemView, DATA> {

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    parentView: PARENT;

    parentElement: api.dom.Element;

    data: DATA;

    element: api.dom.Element;

    positionIndex: number = -1;

    /**
     * Optional. The ItemViewIdProducer of parentRegionView will be used if not set.
     */
    setItemViewIdProducer(value: ItemViewIdProducer): CreateItemViewConfig<PARENT, DATA> {
        this.itemViewIdProducer = value;
        return this;
    }

    /**
     * Optional. The ItemViewFactory of parentRegionView will be used if not set.
     */
    setItemViewFactory(value: ItemViewFactory): CreateItemViewConfig<PARENT, DATA> {
        this.itemViewFactory = value;
        return this;
    }

    setParentView(value: PARENT): CreateItemViewConfig<PARENT, DATA> {
        this.parentView = value;
        return this;
    }

    setParentElement(value: api.dom.Element): CreateItemViewConfig<PARENT, DATA> {
        this.parentElement = value;
        return this;
    }

    setData(value: DATA): CreateItemViewConfig<PARENT, DATA> {
        this.data = value;
        return this;
    }

    setElement(value: api.dom.Element): CreateItemViewConfig<PARENT, DATA> {
        this.element = value;
        return this;
    }

    /**
     * Optional. If not set then ItemView should be added as last child.
     */
    setPositionIndex(value: number): CreateItemViewConfig<PARENT, DATA> {
        this.positionIndex = value;
        return this;
    }
}

export class CreateFragmentViewConfig
    extends CreateItemViewConfig<RegionView, FragmentComponent> {

    fragmentContent: Content;
    sourceComponentType: ComponentType;

    setFragmentContent(value: Content): CreateFragmentViewConfig {
        this.fragmentContent = value;
        return this;
    }

    setSourceComponentType(value: ComponentType): CreateFragmentViewConfig {
        this.sourceComponentType = value;
        return this;
    }

}
