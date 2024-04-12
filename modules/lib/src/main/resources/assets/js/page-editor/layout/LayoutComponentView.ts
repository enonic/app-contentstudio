import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ComponentViewBuilder} from '../ComponentView';
import {LayoutItemType} from './LayoutItemType';
import {ItemViewAddedEvent} from '../ItemViewAddedEvent';
import {ItemViewRemovedEvent} from '../ItemViewRemovedEvent';
import {LayoutPlaceholder} from './LayoutPlaceholder';
import {ItemView} from '../ItemView';
import {ItemType} from '../ItemType';
import {RegionItemType} from '../RegionItemType';
import {RegionView, RegionViewBuilder} from '../RegionView';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {DescriptorBasedComponentView} from '../DescriptorBasedComponentView';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DescriptorBasedComponent} from '../../app/page/region/DescriptorBasedComponent';

export class LayoutComponentViewBuilder
    extends ComponentViewBuilder {

    constructor() {
        super();
        this.setType(LayoutItemType.get());
    }
}

export class LayoutComponentView
    extends DescriptorBasedComponentView {

    private regionViews: RegionView[];

    private readonly itemViewAddedListener: (event: ItemViewAddedEvent) => void;

    private readonly itemViewRemovedListener: (event: ItemViewRemovedEvent) => void;

    public static debug: boolean = false;

    constructor(builder: LayoutComponentViewBuilder) {
        super(builder.setInspectActionRequired(true).setPlaceholder(new LayoutPlaceholder()));

        this.regionViews = [];
        this.itemViewAddedListener = (event: ItemViewAddedEvent) => this.notifyItemViewAdded(event.getView(), event.isNewlyCreated());
        this.itemViewRemovedListener = (event: ItemViewRemovedEvent) => this.notifyItemViewRemoved(event.getView());

        this.parseRegions();
    }

    getComponentViewByPath(path: ComponentPath): ItemView {
        let result: ItemView = null;

        this.regionViews.some((regionView: RegionView) => {
            if (regionView.getPath().equals(path)) {
                result = regionView;
            } else {
                result = regionView.getComponentViewByPath(path);
            }

            return !!result;
        });

        return result;
    }

    getRegions(): RegionView[] {
        return this.regionViews;
    }

    toItemViewArray(): ItemView[] {

        let array: ItemView[] = [];
        array.push(this);
        this.regionViews.forEach((regionView: RegionView) => {
            let itemsInRegion = regionView.toItemViewArray();
            array = array.concat(itemsInRegion);
        });
        return array;
    }

    protected makeEmptyDescriptorText(component: DescriptorBasedComponent): string {
        const descriptorName = component.getName()?.toString() || component.getDescriptorKey().toString();
        return `${i18n('field.layout')} "${descriptorName}"`;
    }

    private parseRegions() {
        this.regionViews.forEach((regionView) => {
            this.unregisterRegionView(regionView);
        });

        this.regionViews = [];

        return this.doParseRegions();
    }

    private doParseRegions(parentElement?: Element) {
        let children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            let itemType = ItemType.fromElement(childElement);
            let isRegionView = ObjectHelper.iFrameSafeInstanceOf(childElement, RegionView);

            if (isRegionView) {
                //
            } else if (itemType && RegionItemType.get().equals(itemType)) {
                const regionName = RegionItemType.getRegionName(childElement);
                const builder = new RegionViewBuilder()
                    .setParentView(this)
                    .setParentElement(parentElement ? parentElement : this)
                    .setName(regionName)
                    .setLiveEditParams(this.liveEditParams)
                    .setElement(childElement);

                this.registerRegionView(new RegionView(builder));
            } else {
                this.doParseRegions(childElement);
            }
        });
    }

    private registerRegionView(regionView: RegionView) {
        if (LayoutComponentView.debug) {
            console.log('LayoutComponentView.registerRegionView: ' + regionView.toString());
        }

        this.regionViews.push(regionView);
        this.notifyItemViewAdded(regionView);

        regionView.onItemViewAdded(this.itemViewAddedListener);
        regionView.onItemViewRemoved(this.itemViewRemovedListener);
    }

    private unregisterRegionView(regionView: RegionView) {
        if (LayoutComponentView.debug) {
            console.log('LayoutComponentView.unregisterRegionView: ' + regionView.toString(), this.regionViews);
        }

        let index = this.regionViews.indexOf(regionView);
        if (index > -1) {
            this.regionViews.splice(index, 1);

            this.notifyItemViewRemoved(regionView);

            regionView.unItemViewAdded(this.itemViewAddedListener);
            regionView.unItemViewRemoved(this.itemViewRemovedListener);
        }
    }
}
