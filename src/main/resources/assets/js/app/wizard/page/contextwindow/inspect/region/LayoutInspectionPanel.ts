import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {GetLayoutDescriptorByKeyRequest} from './GetLayoutDescriptorByKeyRequest';
import {LayoutDescriptorDropdown} from './LayoutDescriptorDropdown';
import {LayoutComponent} from '../../../../../page/region/LayoutComponent';
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import i18n = api.util.i18n;

export class LayoutInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<LayoutComponent, LayoutDescriptor> {

    constructor() {
        super(<DescriptorBasedComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('layout', 'icon-xlarge')
        });
    }

    protected createSelector(): LayoutDescriptorDropdown {
        return new LayoutDescriptorDropdown();
    }

    protected getFormName(): string {
        return i18n('field.layout');
    }

    protected createGetDescriptorRequest(key: DescriptorKey): GetLayoutDescriptorByKeyRequest {
        return new GetLayoutDescriptorByKeyRequest(key);
    }

    getName(): string {
        return i18n('live.view.insert.layout');
    }
}
