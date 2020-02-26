import {ItemType} from './ItemType';
import {ItemTypeConfig, ItemTypeConfigJson} from './ItemTypeConfig';

export class ContentItemType
    extends ItemType {

    private static INSTANCE: ContentItemType = new ContentItemType();

    static get(): ContentItemType {
        return ContentItemType.INSTANCE;
    }

    constructor() {
        super('content');
    }

    protected getItemTypeConfig(itemType: string): ItemTypeConfig {
        return new ItemTypeConfig(<ItemTypeConfigJson>{
            cssSelector: '[data-portal-component-type=content]',
            draggable: false,
            cursor: 'pointer',
            iconCls: 'live-edit-font-icon-content',
            highlighterStyle: {
                stroke: '',
                strokeDasharray: '',
                fill: 'rgba(0, 108, 255, .25)'
            },
            contextMenuConfig: ['parent', 'opencontent', 'view']
        });
    }
}

ContentItemType.get();
