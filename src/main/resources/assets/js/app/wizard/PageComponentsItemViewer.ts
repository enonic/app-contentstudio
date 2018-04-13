import '../../api.ts';
import {ItemView} from '../../page-editor/ItemView';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {TextComponentViewer} from '../../page-editor/text/TextComponentViewer';
import {FragmentItemType} from '../../page-editor/fragment/FragmentItemType';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {PageItemType} from '../../page-editor/PageItemType';
import Content = api.content.Content;
import TextComponent = api.content.page.region.TextComponent;

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

        return object.getType() ? object.getType().getShortName() : '';
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
