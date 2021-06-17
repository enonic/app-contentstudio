import {
    DescriptorBasedComponentInspectionPanel, DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {PartComponent} from '../../../../../page/region/PartComponent';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PartComponentType} from '../../../../../page/region/PartComponentType';

export class PartInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<PartComponent> {

    constructor() {
        super(<DescriptorBasedComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType(PartComponentType.get().getShortName(), 'icon-xlarge'),
            componentType: PartComponentType.get()
        });
    }

    protected getFormName(): string {
        return i18n('field.part');
    }

    getName(): string {
        return i18n('widget.components.insert.part');
    }
}
