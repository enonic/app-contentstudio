import {ItemView} from './ItemView';
import {CreateFragmentViewConfig, CreateItemViewConfig} from './CreateItemViewConfig';
import {FragmentComponentView, FragmentComponentViewBuilder} from './fragment/FragmentComponentView';
import {RegionView, RegionViewBuilder} from './RegionView';
import {LayoutComponentView, LayoutComponentViewBuilder} from './layout/LayoutComponentView';
import {PartComponentView, PartComponentViewBuilder} from './part/PartComponentView';
import {TextComponentView, TextComponentViewBuilder} from './text/TextComponentView';
import {ItemType} from './ItemType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {CreateTextComponentViewConfig} from './CreateTextComponentViewConfig';

export interface ItemViewFactory {
    createView(type: ItemType, config: CreateItemViewConfig<ItemView>): ItemView;
}

export class DefaultItemViewFactory
    implements ItemViewFactory {

    public createView(type: ItemType, config: CreateItemViewConfig<ItemView>): ItemView {
        switch (type.getShortName()) {
        case 'fragment':
            return this.createFragmentView(config as CreateFragmentViewConfig);
        case 'layout':
            return this.createLayoutView(config as CreateItemViewConfig<RegionView>);
        case 'part':
            return this.createPartView(config as CreateItemViewConfig<RegionView>);
        case 'text':
            return this.createTextView(config as CreateItemViewConfig<RegionView>);
        case 'region':
            return this.createRegionView(config);
        case 'page':
        default:
            throw new Error(i18n('live.view.itemtype.error.createviewnotsupported'));
        }
    }

    private createFragmentView(config: CreateFragmentViewConfig): FragmentComponentView {
        return new FragmentComponentView(new FragmentComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setLiveEditParams(config.liveEditParams)
            .setPositionIndex(config.positionIndex));
    }

    private createLayoutView(config: CreateItemViewConfig<RegionView>): LayoutComponentView {
        return new LayoutComponentView(new LayoutComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setLiveEditParams(config.liveEditParams)
            .setPositionIndex(config.positionIndex));
    }

    private createPartView(config: CreateItemViewConfig<RegionView>): PartComponentView {
        return new PartComponentView(new PartComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setLiveEditParams(config.liveEditParams)
            .setPositionIndex(config.positionIndex));
    }

    private createTextView(config: CreateItemViewConfig<RegionView>): TextComponentView {
        return new TextComponentView(new TextComponentViewBuilder()
            .setText(config instanceof CreateTextComponentViewConfig ? config.text : null)
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setLiveEditParams(config.liveEditParams)
            .setPositionIndex(config.positionIndex));
    }

    private createRegionView(config: CreateItemViewConfig<ItemView>): RegionView {
        return new RegionView(new RegionViewBuilder()
            .setParentView(config.parentView)
            .setParentElement(config.parentElement)
            .setLiveEditParams(config.liveEditParams)
            .setElement(config.element));
    }
}
