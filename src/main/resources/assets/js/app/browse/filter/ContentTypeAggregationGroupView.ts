import {AggregationGroupView} from 'lib-admin-ui/aggregation/AggregationGroupView';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {LoadMask} from 'lib-admin-ui/ui/mask/LoadMask';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {AggregationView} from 'lib-admin-ui/aggregation/AggregationView';

export class ContentTypeAggregationGroupView
    extends AggregationGroupView {

    initialize() {

        let displayNameMap: { [name: string]: string } = {};

        let mask: LoadMask = new LoadMask(this);
        this.appendChild(mask);
        this.onRendered(() => mask.show());

        this.setTooltipActive(true);

        let request = new GetAllContentTypesRequest();
        request.sendAndParse().done((contentTypes: ContentTypeSummary[]) => {

            contentTypes.forEach((contentType: ContentTypeSummary) => {
                displayNameMap[contentType.getName().toLowerCase()] = contentType.getDisplayName();
            });

            this.getAggregationViews().forEach((aggregationView: AggregationView) => {
                aggregationView.setDisplayNamesMap(displayNameMap);
            });
            mask.remove();
        });

    }

}
