import {AggregationGroupView} from 'lib-admin-ui/aggregation/AggregationGroupView';
import {AggregationView} from 'lib-admin-ui/aggregation/AggregationView';
import {CompareStatus, CompareStatusFormatter} from '../../content/CompareStatus';

export class ContentStatusAggregationGroupView
    extends AggregationGroupView {

    initialize() {
        const displayNameMap: { [name: string]: string } = {};
        this.setTooltipActive(true);

        displayNameMap[CompareStatus.NEW] = CompareStatusFormatter.formatStatusText(CompareStatus.NEW);
        displayNameMap[CompareStatus.EQUAL] = CompareStatusFormatter.formatStatusText(CompareStatus.EQUAL);
        displayNameMap[CompareStatus.NEWER] = CompareStatusFormatter.formatStatusText(CompareStatus.NEWER);
        displayNameMap[CompareStatus.MOVED] = CompareStatusFormatter.formatStatusText(CompareStatus.MOVED);

        this.getAggregationViews().forEach((aggregationView: AggregationView) => {
            aggregationView.setDisplayNamesMap(displayNameMap);
        });
    }
}
