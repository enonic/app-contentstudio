import {ItemView} from './ItemView';
import {CreateFragmentViewConfig, CreateItemViewConfig} from './CreateItemViewConfig';
import {FragmentComponentView, FragmentComponentViewBuilder} from './fragment/FragmentComponentView';
import {RegionView, RegionViewBuilder} from './RegionView';
import {ImageComponentView, ImageComponentViewBuilder} from './image/ImageComponentView';
import {LayoutComponentView, LayoutComponentViewBuilder} from './layout/LayoutComponentView';
import {PartComponentView, PartComponentViewBuilder} from './part/PartComponentView';
import {TextComponentView, TextComponentViewBuilder} from './text/TextComponentView';
import {ContentView, ContentViewBuilder} from './ContentView';
import {ItemType} from './ItemType';
import {Content} from '../app/content/Content';
import {ImageComponent} from '../app/page/region/ImageComponent';
import {LayoutComponent} from '../app/page/region/LayoutComponent';
import {PartComponent} from '../app/page/region/PartComponent';
import {TextComponent} from '../app/page/region/TextComponent';
import {Region} from '../app/page/region/Region';
import {i18n} from 'lib-admin-ui/util/Messages';

export interface ItemViewFactory {
    createView(type: ItemType, config: CreateItemViewConfig<ItemView, any>): ItemView;
}

export class DefaultItemViewFactory
    implements ItemViewFactory {

    public createView(type: ItemType, config: CreateItemViewConfig<ItemView, any>): ItemView {
        switch (type.getShortName()) {
        case 'fragment':
            return this.createFragmentView(<CreateFragmentViewConfig>config);
        case 'image':
            return this.createImageView(<CreateItemViewConfig<RegionView, ImageComponent>>config);
        case 'layout':
            return this.createLayoutView(<CreateItemViewConfig<RegionView, LayoutComponent>>config);
        case 'part':
            return this.createPartView(<CreateItemViewConfig<RegionView, PartComponent>>config);
        case 'text':
            return this.createTextView(<CreateItemViewConfig<RegionView, TextComponent>>config);
        case 'region':
            return this.createRegionView(<CreateItemViewConfig<ItemView, Region>>config);
        case 'content':
            return this.createContentView(<CreateItemViewConfig<PartComponentView, Content>>config);
        case 'page':
        default:
            throw new Error(i18n('live.view.itemtype.error.createviewnotsupported'));
        }
    }

    private createFragmentView(config: CreateFragmentViewConfig): FragmentComponentView {
        return new FragmentComponentView(<FragmentComponentViewBuilder>new FragmentComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setComponent(config.data)
            .setPositionIndex(config.positionIndex));
    }

    private createImageView(config: CreateItemViewConfig<RegionView, ImageComponent>): ImageComponentView {
        return new ImageComponentView(<ImageComponentViewBuilder>new ImageComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setComponent(config.data)
            .setPositionIndex(config.positionIndex));
    }

    private createLayoutView(config: CreateItemViewConfig<RegionView, LayoutComponent>): LayoutComponentView {
        return new LayoutComponentView(new LayoutComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setComponent(config.data)
            .setElement(config.element)
            .setPositionIndex(config.positionIndex));
    }

    private createPartView(config: CreateItemViewConfig<RegionView, PartComponent>): PartComponentView {
        return new PartComponentView(new PartComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setComponent(config.data)
            .setElement(config.element)
            .setPositionIndex(config.positionIndex));
    }

    private createTextView(config: CreateItemViewConfig<RegionView, TextComponent>): TextComponentView {
        return new TextComponentView(new TextComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setComponent(config.data)
            .setElement(config.element)
            .setPositionIndex(config.positionIndex));
    }

    private createRegionView(config: CreateItemViewConfig<ItemView, Region>): RegionView {
        return new RegionView(new RegionViewBuilder()
            .setParentView(config.parentView)
            .setParentElement(config.parentElement)
            .setRegion(config.data)
            .setElement(config.element));
    }

    private createContentView(config: CreateItemViewConfig<PartComponentView, any>): ContentView {
        return new ContentView(new ContentViewBuilder()
            .setParentPartComponentView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element));
    }
}
