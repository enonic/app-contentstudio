import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {GetLayoutDescriptorByKeyRequest} from './GetLayoutDescriptorByKeyRequest';
import {LayoutDescriptorDropdown} from './LayoutDescriptorDropdown';
import {LayoutComponent} from '../../../../../page/region/LayoutComponent';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {i18n} from 'lib-admin-ui/util/Messages';

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
        return i18n('widget.components.insert.layout');
    }
}
