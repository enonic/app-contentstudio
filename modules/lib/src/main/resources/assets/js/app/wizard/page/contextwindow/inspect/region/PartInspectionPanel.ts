import {
    DescriptorBasedComponentInspectionPanel, DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {PartComponent} from '../../../../../page/region/PartComponent';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PartComponentType} from '../../../../../page/region/PartComponentType';

export class PartInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<PartComponent> {

    constructor() {
        super({
            iconClass: ItemViewIconClassResolver.resolveByType(PartComponentType.get().getShortName(), 'icon-xlarge'),
            componentType: PartComponentType.get()
        } as DescriptorBasedComponentInspectionPanelConfig);
    }

    protected getFormName(): string {
        return i18n('field.part');
    }
}
