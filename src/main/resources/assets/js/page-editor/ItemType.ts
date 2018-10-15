import {ItemTypeConfig} from './ItemTypeConfig';
import {ComponentType} from '../app/page/region/ComponentType';
import StringHelper = api.util.StringHelper;
import i18n = api.util.i18n;

type ShortName = { [shortName: string]: ItemType };

export class ItemType
    implements api.Equitable {

    static ATTRIBUTE_TYPE: string = 'portal-component-type';
    static ATTRIBUTE_REGION_NAME: string = 'portal-region';

    private static shortNameToInstance: ShortName = {};

    private shortName: string;

    private config: ItemTypeConfig;

    constructor(shortName: string) {
        ItemType.shortNameToInstance[shortName] = this;
        this.shortName = shortName;
        this.config = this.getItemTypeConfig(shortName);
    }

    protected getItemTypeConfig(itemType: string): ItemTypeConfig {
        return null;
    }

    getShortName(): string {
        return this.shortName;
    }

    getConfig(): ItemTypeConfig {
        return this.config;
    }

    isComponentType(): boolean {
        return false;
    }

    toComponentType(): ComponentType {
        api.util.assert(this.isComponentType(), i18n('live.view.itemtype.error.isnotcomponenttype'));
        return ComponentType.byShortName(this.shortName);
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ItemType)) {
            return false;
        }

        const other = <ItemType>o;
        return api.ObjectHelper.stringEquals(this.shortName, other.shortName);
    }

    static getDraggables(): ItemType[] {
        const draggables: ItemType[] = [];
        for (const shortName in  ItemType.shortNameToInstance) {
            if (ItemType.shortNameToInstance.hasOwnProperty(shortName)) {
                const itemType = ItemType.shortNameToInstance[shortName];
                if (itemType.getConfig().isDraggable()) {
                    draggables.push(itemType);
                }
            }
        }
        return draggables;
    }

    static fromComponentType(componentType: ComponentType): ItemType {
        return ItemType.byShortName(componentType.getShortName());
    }

    static byShortName(shortName: string): ItemType {
        return ItemType.shortNameToInstance[shortName];
    }

    static fromHTMLElement(element: HTMLElement): ItemType {
        let typeAsString = element.getAttribute('data-' + ItemType.ATTRIBUTE_TYPE);
        if (StringHelper.isBlank(typeAsString)) {
            let regionName = element.getAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
            if (!StringHelper.isBlank(regionName)) {
                typeAsString = 'region';
            }
        }
        return ItemType.byShortName(typeAsString);
    }

    static fromElement(element: api.dom.Element): ItemType {
        return ItemType.fromHTMLElement(element.getHTMLElement());
    }
}
