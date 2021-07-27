import {Element} from 'lib-admin-ui/dom/Element';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {LayoutItemType} from './LayoutItemType';
import {ItemViewAddedEvent} from '../ItemViewAddedEvent';
import {ItemViewRemovedEvent} from '../ItemViewRemovedEvent';
import {LayoutComponentViewer} from './LayoutComponentViewer';
import {LayoutPlaceholder} from './LayoutPlaceholder';
import {ItemView} from '../ItemView';
import {ItemType} from '../ItemType';
import {RegionItemType} from '../RegionItemType';
import {DragAndDrop} from '../DragAndDrop';
import {RegionView, RegionViewBuilder} from '../RegionView';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {Component} from '../../app/page/region/Component';

export class LayoutComponentViewBuilder
    extends ComponentViewBuilder<LayoutComponent> {

    constructor() {
        super();
        this.setType(LayoutItemType.get());
    }
}

export class LayoutComponentView
    extends ComponentView<LayoutComponent> {

    private regionViews: RegionView[];

    private itemViewAddedListener: (event: ItemViewAddedEvent) => void;

    private itemViewRemovedListener: (event: ItemViewRemovedEvent) => void;

    public static debug: boolean = false;

    constructor(builder: LayoutComponentViewBuilder) {
        super(builder.setViewer(new LayoutComponentViewer()).setInspectActionRequired(true));

        this.setPlaceholder(new LayoutPlaceholder(this));
        this.regionViews = [];

        this.liveEditModel = builder.parentRegionView.getLiveEditModel();
        LayoutComponentView.debug = false;

        this.itemViewAddedListener = (event: ItemViewAddedEvent) => this.notifyItemViewAdded(event.getView(), event.isNewlyCreated());
        this.itemViewRemovedListener = (event: ItemViewRemovedEvent) => this.notifyItemViewRemoved(event.getView());

        this.parseRegions();
    }

    getRegionViewByName(name: string): RegionView {

        for (let i = 0; i < this.regionViews.length; i++) {
            let regionView = this.regionViews[i];
            if (regionView.getRegionName() === name) {
                return regionView;
            }
        }
        return null;
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    getComponentViewByPath(path: ComponentPath): ComponentView<Component> {

        let firstLevelOfPath = path.getFirstLevel();

        for (let i = 0; i < this.regionViews.length; i++) {
            let regionView = this.regionViews[i];
            if (firstLevelOfPath.getRegionName() === regionView.getRegionName()) {
                if (path.numberOfLevels() === 1) {
                    return regionView.getComponentViewByIndex(firstLevelOfPath.getComponentIndex());
                } else {
                    const index = firstLevelOfPath.getComponentIndex();
                    const layoutView: LayoutComponentView = <LayoutComponentView>regionView.getComponentViewByIndex(index);
                    return layoutView.getComponentViewByPath(path.removeFirstLevel());
                }
            }
        }

        return null;
    }

    setComponent(layoutComponent: LayoutComponent) {
        super.setComponent(layoutComponent);

        if (!this.regionViews) {
            return;
        }

        let regions = layoutComponent.getRegions().getRegions();
        this.regionViews.forEach((regionView: RegionView, index: number) => {
            let region = regions[index];
            regionView.setRegion(region);
        });
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

    private parseRegions() {
        this.regionViews.forEach((regionView) => {
            this.unregisterRegionView(regionView);
        });

        this.regionViews = [];

        return this.doParseRegions();
    }

    private doParseRegions(parentElement?: Element) {

        let layoutComponent: LayoutComponent = this.getComponent();
        let layoutRegions = layoutComponent.getRegions();
        if (!layoutRegions) {
            return;
        }
        let children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            let itemType = ItemType.fromElement(childElement);
            let isRegionView = ObjectHelper.iFrameSafeInstanceOf(childElement, RegionView);
            let region;
            let regionName;
            let regionView;

            if (isRegionView) {
                regionName = RegionItemType.getRegionName(childElement);
                region = layoutRegions.getRegionByName(regionName);
                if (region) {
                    // reuse existing region view
                    regionView = <RegionView> childElement;
                    // update view's data
                    regionView.setRegion(region);
                    // register it again because we unregistered everything before parsing
                    this.registerRegionView(regionView);
                }

            } else if (itemType && RegionItemType.get().equals(itemType)) {
                regionName = RegionItemType.getRegionName(childElement);
                region = layoutRegions.getRegionByName(regionName);

                if (region) {
                    regionView = new RegionView(
                        new RegionViewBuilder().setParentView(this).setParentElement(parentElement ? parentElement : this).setRegion(
                            region).setElement(childElement));

                    this.registerRegionView(regionView);
                }

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
