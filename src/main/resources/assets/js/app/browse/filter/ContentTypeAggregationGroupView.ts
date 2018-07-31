import AggregationGroupView = api.aggregation.AggregationGroupView;

export class ContentTypeAggregationGroupView
    extends AggregationGroupView {

    initialize() {

        let displayNameMap: { [name: string]: string } = {};

        let mask: api.ui.mask.LoadMask = new api.ui.mask.LoadMask(this);
        this.appendChild(mask);
        this.onRendered(() => mask.show());

        this.setTooltipActive(true);

        let request = new api.schema.content.GetAllContentTypesRequest();
        request.sendAndParse().done((contentTypes: api.schema.content.ContentTypeSummary[]) => {

            contentTypes.forEach((contentType: api.schema.content.ContentTypeSummary) => {
                displayNameMap[contentType.getName().toLowerCase()] = contentType.getDisplayName();
            });

            this.getAggregationViews().forEach((aggregationView: api.aggregation.AggregationView) => {
                aggregationView.setDisplayNamesMap(displayNameMap);
            });
            mask.remove();
        });

    }

}
