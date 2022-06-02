import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {TextComponentView} from '../../../../../../page-editor/text/TextComponentView';
import {TextComponentViewer} from '../../../../../../page-editor/text/TextComponentViewer';
import {TextComponent} from '../../../../../page/region/TextComponent';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';

export class TextInspectionPanel
    extends BaseInspectionPanel {

    private namesAndIcon: NamesAndIconView;

    constructor() {
        super();

        this.namesAndIcon =
            new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium)).setIconClass(
                ItemViewIconClassResolver.resolveByType('text'));

        this.appendChild(this.namesAndIcon);
    }

    setTextComponent(textComponentView: TextComponentView) {

        let textComponent: TextComponent = textComponentView.getComponent();

        if (textComponent) {
            let viewer = <TextComponentViewer>textComponentView.getViewer();
            this.namesAndIcon.setMainName(viewer.resolveDisplayName(textComponent, textComponentView));
            this.namesAndIcon.setSubName(viewer.resolveSubName(textComponent));
            this.namesAndIcon.setIconClass(viewer.resolveIconClass(textComponent));
        }
    }

    getName(): string {
        return i18n('widget.components.insert.text');
    }

}
