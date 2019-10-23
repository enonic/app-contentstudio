import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';

export class ItemViewContextMenuTitle
    extends NamesAndIconView {

    constructor(name: string, icon: string) {
        super(new NamesAndIconViewBuilder().setAddTitleAttribute(false));
        this.setMainName(name);
        this.setIconClass(StyleHelper.COMMON_PREFIX + icon);
    }

}
