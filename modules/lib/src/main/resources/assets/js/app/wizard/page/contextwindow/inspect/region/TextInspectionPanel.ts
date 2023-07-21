import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {TextComponent} from '../../../../../page/region/TextComponent';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {TextComponentType} from '../../../../../page/region/TextComponentType';

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

    setTextComponent(textComponent: TextComponent) {
        if (textComponent) {
            this.namesAndIcon.setMainName(textComponent.getText() || textComponent.getName().toString());
            this.namesAndIcon.setSubName(textComponent.getPath()?.toString() || '');
            this.namesAndIcon.setIconClass(StyleHelper.getCommonIconCls(TextComponentType.get().getShortName()));
        }
    }

    getName(): string {
        return i18n('widget.components.insert.text');
    }

}
