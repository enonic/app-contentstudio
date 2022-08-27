import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ItemView} from '../../page-editor/ItemView';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {TextComponentViewer} from '../../page-editor/text/TextComponentViewer';
import {FragmentItemType} from '../../page-editor/fragment/FragmentItemType';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {PageItemType} from '../../page-editor/PageItemType';
import {Content} from '../content/Content';
import {LayoutItemType} from '../../page-editor/layout/LayoutItemType';
import {PartItemType} from '../../page-editor/part/PartItemType';
import {PartComponentView} from '../../page-editor/part/PartComponentView';
import {LayoutComponentView} from '../../page-editor/layout/LayoutComponentView';
import {PageView} from '../../page-editor/PageView';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {ItemViewTreeGridWrapper} from '../../page-editor/ItemViewTreeGridWrapper';
import {Descriptor} from '../page/Descriptor';

export class PageComponentsItemViewer
    extends NamesAndIconViewer<ItemViewTreeGridWrapper> {

    private readonly content: Content;

    constructor(content: Content) {
        super('page-components-item-viewer');

        this.content = content;
    }

    resolveDisplayName(item: ItemViewTreeGridWrapper): string {
        const object: ItemView = item.getItemView();

        if (ObjectHelper.iFrameSafeInstanceOf(object.getType(), TextItemType)) {
            let textView = <TextComponentView>object;
            let textComponent = textView.getComponent();
            let viewer = <TextComponentViewer>object.getViewer();
            return viewer.resolveDisplayName(textComponent, textView);
        } else if (ObjectHelper.iFrameSafeInstanceOf(object.getType(), FragmentItemType)) {
            let fragmentView = <FragmentComponentView> object;
            if (fragmentView.isLoaded()) {
                return fragmentView.getFragmentDisplayName();
            }
        }

        return item.getDisplayName() || object.getName();
    }

    resolveSubName(item: ItemViewTreeGridWrapper, relativePath: boolean = false): string {
        const object: ItemView = item.getItemView();

        if (ObjectHelper.iFrameSafeInstanceOf(object.getType(), FragmentItemType)) {
            const fragmentComponent = (<FragmentComponentView>object).getFragmentRootComponent();

            if (fragmentComponent) {
                return fragmentComponent.getType().getShortName();
            }
        }

        if (PageItemType.get().equals(object.getType()) ||
            PartItemType.get().equals(object.getType()) ||
            LayoutItemType.get().equals(object.getType())) {

            return this.resolveComponentDescription(object) || '<' + i18n('text.noDescription') + '>';
        }

        return object.getType() ? object.getType().getShortName() : '';
    }

    private resolveComponentDescription(object: ItemView): string {
        if (PartItemType.get().equals(object.getType())) {
            return (<PartComponentView>object).getComponent().getDescription();
        }

        if (LayoutItemType.get().equals(object.getType())) {
            return (<LayoutComponentView>object).getComponent().getDescription();
        }

        if (PageItemType.get().equals(object.getType())) {
            const pageController: Descriptor = (<PageView>object).getModel().getController();
            if (pageController) {
                return pageController.getDescription();
            }
        }
        return null;
    }

    resolveIconUrl(item: ItemViewTreeGridWrapper): string {
        const object: ItemView = item.getItemView();

        if (PageItemType.get().equals(object.getType())) {
            return object.getIconUrl(this.content);
        } else if (PartItemType.get().equals(object.getType())) {
            return (<PartComponentView>object).getComponent().getIcon();
        }

        return null;
    }

    resolveIconClass(object: ItemViewTreeGridWrapper): string {
        return object.getItemView().getIconClass();
    }
}
