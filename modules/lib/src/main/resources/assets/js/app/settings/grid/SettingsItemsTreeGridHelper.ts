import {GridColumnConfig} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {SettingsItemRowFormatter} from './SettingsItemRowFormatter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class SettingsItemsTreeGridHelper {

    public static generateColumnsConfig(): GridColumnConfig[] {
        return [{
            name: i18n('field.name'),
            id: 'name',
            field: 'displayName',
            formatter: SettingsItemRowFormatter.nameFormatter,
            style: {minWidth: 200}
        }];
    }
}
