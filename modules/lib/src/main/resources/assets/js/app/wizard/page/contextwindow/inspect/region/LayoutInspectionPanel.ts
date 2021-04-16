import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {LayoutComponent} from '../../../../../page/region/LayoutComponent';
import {i18n} from 'lib-admin-ui/util/Messages';
import {LayoutComponentType} from '../../../../../page/region/LayoutComponentType';
import {Descriptor} from '../../../../../page/Descriptor';

export class LayoutInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<LayoutComponent, Descriptor> {

    constructor() {
        super(<DescriptorBasedComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType(LayoutComponentType.get().getShortName(), 'icon-xlarge'),
            componentType: LayoutComponentType.get()
        });
    }
/*
    protected createSelector(): LayoutDescriptorDropdown {
        return new LayoutDescriptorDropdown();
    }
*/
    protected getFormName(): string {
        return i18n('field.layout');
    }
/*
    protected createGetDescriptorRequest(key: DescriptorKey): GetComponentDescriptorRequest {
        return new GetComponentDescriptorRequest(key.toString(), LayoutComponentType.NAME);
    }
*/
    getName(): string {
        return i18n('widget.components.insert.layout');
    }
}
