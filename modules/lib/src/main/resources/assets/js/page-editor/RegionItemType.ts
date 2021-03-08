import {Element} from 'lib-admin-ui/dom/Element';
import {ItemType} from './ItemType';
import {ItemTypeConfig, ItemTypeConfigJson} from './ItemTypeConfig';

export class RegionItemType
    extends ItemType {

    private static INSTANCE: RegionItemType = new RegionItemType();

    static get(): RegionItemType {
        return RegionItemType.INSTANCE;
    }

    constructor() {
        super('region');
    }

    static getRegionName(element: Element): string {
        return element.getEl().getAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
    }

    protected getItemTypeConfig(itemType: string): ItemTypeConfig {
        return new ItemTypeConfig(<ItemTypeConfigJson>{
            cssSelector: '[data-portal-region]',
            draggable: false,
            cursor: 'pointer',
            iconCls: 'icon-region',
            highlighterStyle: {
                stroke: 'rgba(20, 20, 20, 1)', // not used
                strokeDasharray: '4 4',
                fill: 'rgba(255, 255, 255, 0)' // not used
            },
            contextMenuConfig: ['parent', 'clearRegion']
        });
    }
}

RegionItemType.get();
