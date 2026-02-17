import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import type {ItemView} from '../page-editor-types';

export class ItemViewIconClassResolver {

    public static resolveByView(itemView: ItemView): string {
        if (!itemView) {
            return '';
        }
        return ItemViewIconClassResolver.resolveByType(itemView.getType().getShortName());
    }

    public static resolveByType(itemType: string, size?: string): string {
        return StyleHelper.getCommonIconCls(itemType.toLowerCase()) + (size ? ' ' + size : '');
    }
}
