import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {GetPartDescriptorByKeyRequest} from './GetPartDescriptorByKeyRequest';
import {PartDescriptorDropdown} from './PartDescriptorDropdown';
import {PartComponent} from '../../../../../page/region/PartComponent';
import PartDescriptor = api.content.page.region.PartDescriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import i18n = api.util.i18n;

export class PartInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<PartComponent, PartDescriptor> {

    constructor() {
        super(<DescriptorBasedComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('part', 'icon-xlarge')
        });
    }

    protected createSelector(): PartDescriptorDropdown {
        return new PartDescriptorDropdown();
    }

    protected getFormName(): string {
        return i18n('field.part');
    }

    protected createGetDescriptorRequest(key: DescriptorKey): GetPartDescriptorByKeyRequest {
        return new GetPartDescriptorByKeyRequest(key);
    }

    getName(): string {
        return i18n('live.view.insert.part');
    }
}
