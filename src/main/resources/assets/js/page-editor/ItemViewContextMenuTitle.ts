import './../api.ts';

export class ItemViewContextMenuTitle
    extends api.app.NamesAndIconView {

    constructor(name: string, icon: string) {
        super(new api.app.NamesAndIconViewBuilder().setAddTitleAttribute(false));
        this.setMainName(name);
        this.setIconClass(api.StyleHelper.COMMON_PREFIX + icon);
    }

}
