import '../../../../../../api.ts';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {TextComponentView} from '../../../../../../page-editor/text/TextComponentView';
import {TextComponentViewer} from '../../../../../../page-editor/text/TextComponentViewer';
import TextComponent = api.content.page.region.TextComponent;

export class TextInspectionPanel
    extends BaseInspectionPanel {

    private namesAndIcon: api.app.NamesAndIconView;

    constructor() {
        super();

        this.namesAndIcon =
            new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.medium)).setIconClass(
                ItemViewIconClassResolver.resolveByType('text'));

        this.appendChild(this.namesAndIcon);
    }

    setTextComponent(textComponentView: TextComponentView) {

        let textComponent: TextComponent = <TextComponent>textComponentView.getComponent();

        if (textComponent) {
            let viewer = <TextComponentViewer>textComponentView.getViewer();
            this.namesAndIcon.setMainName(viewer.resolveDisplayName(textComponent, textComponentView));
            this.namesAndIcon.setSubName(viewer.resolveSubName(textComponent));
            this.namesAndIcon.setIconClass(viewer.resolveIconClass(textComponent));
        }
    }

}
