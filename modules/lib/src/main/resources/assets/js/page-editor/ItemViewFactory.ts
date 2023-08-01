import {ItemView, BaseComponent} from './ItemView';
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
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export interface ItemViewFactory {
    createView(type: ItemType, config: CreateItemViewConfig<ItemView, BaseComponent>): ItemView;
}

export class DefaultItemViewFactory
    implements ItemViewFactory {

    public createView(type: ItemType, config: CreateItemViewConfig<ItemView, BaseComponent>): ItemView {
        switch (type.getShortName()) {
        case 'fragment':
            return this.createFragmentView(config as CreateFragmentViewConfig);
        case 'image':
            return this.createImageView(config as CreateItemViewConfig<RegionView, ImageComponent>);
        case 'layout':
            return this.createLayoutView(config as CreateItemViewConfig<RegionView, LayoutComponent>);
        case 'part':
            return this.createPartView(config as CreateItemViewConfig<RegionView, PartComponent>);
        case 'text':
            return this.createTextView(config as CreateItemViewConfig<RegionView, TextComponent>);
        case 'region':
            return this.createRegionView(config as CreateItemViewConfig<ItemView, Region>);
        case 'content':
            return this.createContentView(config as CreateItemViewConfig<PartComponentView, Content>);
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
            .setComponent(config.data)
            .setPositionIndex(config.positionIndex) as FragmentComponentViewBuilder);
    }

    private createImageView(config: CreateItemViewConfig<RegionView, ImageComponent>): ImageComponentView {
        return new ImageComponentView(new ImageComponentViewBuilder()
            .setItemViewIdProducer(config.itemViewIdProducer)
            .setItemViewFactory(config.itemViewFactory)
            .setParentRegionView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element)
            .setComponent(config.data)
            .setPositionIndex(config.positionIndex) as ImageComponentViewBuilder);
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

    private createContentView(config: CreateItemViewConfig<PartComponentView, Content>): ContentView {
        return new ContentView(new ContentViewBuilder()
            .setParentPartComponentView(config.parentView)
            .setParentElement(config.parentElement)
            .setElement(config.element));
    }
}
