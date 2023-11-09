import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemView} from './ItemView';
import {ItemViewFactory} from './ItemViewFactory';
import {RegionView} from './RegionView';
import {Content} from '../app/content/Content';
import {ComponentType} from '../app/page/region/ComponentType';
import {FragmentComponent} from '../app/page/region/FragmentComponent';
import {LiveEditParams} from './LiveEditParams';
import {ContentId} from '../app/content/ContentId';

export class CreateItemViewConfig<PARENT extends ItemView> {

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    liveEditParams: LiveEditParams;

    parentView: PARENT;

    parentElement: Element;

    element: Element;

    positionIndex: number = -1;

    /**
     * Optional. The ItemViewIdProducer of parentRegionView will be used if not set.
     */
    setItemViewIdProducer(value: ItemViewIdProducer): this {
        this.itemViewIdProducer = value;
        return this;
    }

    /**
     * Optional. The ItemViewFactory of parentRegionView will be used if not set.
     */
    setItemViewFactory(value: ItemViewFactory): this {
        this.itemViewFactory = value;
        return this;
    }

    setParentView(value: PARENT): this {
        this.parentView = value;
        return this;
    }

    setParentElement(value: Element): this {
        this.parentElement = value;
        return this;
    }

    setElement(value: Element): this {
        this.element = value;
        return this;
    }

    setPositionIndex(value: number): this {
        this.positionIndex = value;
        return this;
    }

    setLiveEditParams(value: LiveEditParams): this {
        this.liveEditParams = value;
        return this;
    }
}

export class CreateFragmentViewConfig
    extends CreateItemViewConfig<RegionView> {

    fragmentContentId: ContentId;

    setFragmentContentId(value: ContentId): this {
        this.fragmentContentId = value;
        return this;
    }

}
