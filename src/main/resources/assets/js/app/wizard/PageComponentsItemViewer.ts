import {ItemView} from '../../page-editor/ItemView';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {TextComponentViewer} from '../../page-editor/text/TextComponentViewer';
import {FragmentItemType} from '../../page-editor/fragment/FragmentItemType';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {PageItemType} from '../../page-editor/PageItemType';
import {Content} from '../content/Content';
import {TextComponent} from '../page/region/TextComponent';
import {LayoutItemType} from '../../page-editor/layout/LayoutItemType';
import {PartItemType} from '../../page-editor/part/PartItemType';
import {PartComponentView} from '../../page-editor/part/PartComponentView';
import {LayoutComponentView} from '../../page-editor/layout/LayoutComponentView';
import {PageView} from '../../page-editor/PageView';
import i18n = api.util.i18n;

export class PageComponentsItemViewer
    extends api.ui.NamesAndIconViewer<ItemView> {

    private content: Content;

    constructor(content: Content) {
        super('page-components-item-viewer');

        this.content = content;
    }

    resolveDisplayName(object: ItemView): string {
        if (api.ObjectHelper.iFrameSafeInstanceOf(object.getType(), TextItemType)) {
            let textView = <TextComponentView> object;
            let textComponent = <TextComponent>textView.getComponent();
            let viewer = <TextComponentViewer>object.getViewer();
            return viewer.resolveDisplayName(textComponent, textView);
        } else if (api.ObjectHelper.iFrameSafeInstanceOf(object.getType(), FragmentItemType)) {
            let fragmentView = <FragmentComponentView> object;
            let fragmentComponent = fragmentView.getFragmentRootComponent();
            if (fragmentComponent && api.ObjectHelper.iFrameSafeInstanceOf(fragmentComponent, TextComponent)) {
                return this.extractTextFromTextComponent(<TextComponent>fragmentComponent) || fragmentComponent.getName().toString();
            }
            if (fragmentView.isLoaded()) {
                return fragmentView.getFragmentDisplayName();
            } else {
                fragmentView.onFragmentContentLoaded(() => {
                    return fragmentView.getFragmentDisplayName();
                });
            }
        }

        return object.getName();
    }

    resolveSubName(object: ItemView, relativePath: boolean = false): string {
        if (api.ObjectHelper.iFrameSafeInstanceOf(object.getType(), FragmentItemType)) {
            let fragmentView = <FragmentComponentView> object;
            let fragmentComponent = fragmentView.getFragmentRootComponent();
            if (fragmentComponent) {
                return fragmentComponent.getType().getShortName();
            }
        }

        if (PageItemType.get().equals(object.getType()) ||
            PartItemType.get().equals(object.getType()) ||
            LayoutItemType.get().equals(object.getType())) {

            return this.resolveComponentDescription(object) || '<' + i18n('live.view.nodescription') + '>';
        }

        return object.getType() ? object.getType().getShortName() : '';
    }

    resolveComponentDescription(object: ItemView): string {
        if (PartItemType.get().equals(object.getType())) {
            const partComponent = (<PartComponentView>object).getComponent();
            return partComponent.getDescription();
        }

        if (LayoutItemType.get().equals(object.getType())) {
            const layoutComponent = (<LayoutComponentView>object).getComponent();
            return layoutComponent.getDescription();
        }

        if (PageItemType.get().equals(object.getType())) {
            const pageController = (<PageView>object).getModel().getController();
            if (pageController) {
                return pageController.getDescription();
            }
        }
        return null;
    }

    resolveIconUrl(object: ItemView): string {
        if (PageItemType.get().equals(object.getType())) {
            return object.getIconUrl(this.content);
        }
        return null;
    }

    resolveIconClass(object: ItemView): string {
        return object.getIconClass();
    }

    private extractTextFromTextComponent(textComponent: TextComponent): string {
        let tmp = document.createElement('DIV');
        tmp.innerHTML = textComponent.getText() || '';
        return (tmp.textContent || tmp.innerText || '').trim();
    }
}
