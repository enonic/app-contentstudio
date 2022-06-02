import {TabItemBuilder} from '@enonic/lib-admin-ui/ui/tab/TabItem';
import {TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';

export class ContentTabBarItem
    extends TabBarItem {

    private iconCls: string;
    private xData: boolean;

    constructor(builder: ContentTabBarItemBuilder) {
        super(builder);

        this.iconCls = builder.iconCls;
        this.xData = builder.xData;

        this.toggleClass('x-data', builder.xData);
        this.toggleClass('step-icon ' + this.iconCls, !!builder.iconCls);
    }

    setLabel(newValue: string, markUnnamed: boolean = false, addLabelTitleAttribute: boolean = true) {

        super.setLabel(newValue, markUnnamed, addLabelTitleAttribute);

        if (this.iconCls) {
            this.addClass('step-icon ' + this.iconCls);
        }
    }

    getFullLabel(): string {
        if (!this.xData) {
            return super.getFullLabel();
        }
        return this.getHTMLElement().innerText.replace(this.getLabel(), '+ ' + this.getLabel());
    }
}

export class ContentTabBarItemBuilder
    extends TabItemBuilder {

    iconCls: string;

    xData: boolean;

    constructor() {
        super();

        this.setAddLabelTitleAttribute(true).setFocusable(false);
    }

    setIconCls(value: string): ContentTabBarItemBuilder {
        this.iconCls = value;

        return this;
    }

    setIsXData(value: boolean): ContentTabBarItemBuilder {
        this.xData = value;

        return this;
    }

    build(): ContentTabBarItem {
        return new ContentTabBarItem(this);
    }

}
