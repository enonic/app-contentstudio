import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {Region} from '../../../../../page/region/Region';

export class RegionInspectionPanel
    extends BaseInspectionPanel {

    private region: Region;

    private namesAndIcon: NamesAndIconView;

    constructor() {
        super();

        this.namesAndIcon =
            new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium)).setIconClass(
                ItemViewIconClassResolver.resolveByType('region'));

        this.appendChild(this.namesAndIcon);
    }

    setRegion(region: Region) {

        this.region = region;

        if (region) {
            this.namesAndIcon.setMainName(region.getName());
            this.namesAndIcon.setSubName(region.getPath().toString());
        } else {
            this.namesAndIcon.setMainName(i18n('field.region'));
            this.namesAndIcon.setSubName('');
        }
    }

    getName(): string {
        return i18n('widget.components.insert.region');
    }

}
