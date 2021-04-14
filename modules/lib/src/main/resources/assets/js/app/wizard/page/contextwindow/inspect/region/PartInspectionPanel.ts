import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {PartDescriptorDropdown} from './PartDescriptorDropdown';
import {PartComponent} from '../../../../../page/region/PartComponent';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {i18n} from 'lib-admin-ui/util/Messages';
import {GetPartDescriptorRequest} from './GetPartDescriptorRequest';

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

    protected createGetDescriptorRequest(key: DescriptorKey): GetPartDescriptorRequest {
        return new GetPartDescriptorRequest(key.toString());
    }

    getName(): string {
        return i18n('widget.components.insert.part');
    }
}
