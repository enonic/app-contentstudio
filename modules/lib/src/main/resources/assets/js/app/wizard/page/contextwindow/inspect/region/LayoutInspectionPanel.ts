import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {LayoutComponent} from '../../../../../page/region/LayoutComponent';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LayoutComponentType} from '../../../../../page/region/LayoutComponentType';

export class LayoutInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<LayoutComponent> {

    constructor() {
        super({
            iconClass: ItemViewIconClassResolver.resolveByType(LayoutComponentType.get().getShortName(), 'icon-xlarge'),
            componentType: LayoutComponentType.get()
        } as DescriptorBasedComponentInspectionPanelConfig);
    }

    protected getFormName(): string {
        return i18n('field.layout');
    }
}
