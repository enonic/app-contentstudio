import Widget = api.content.Widget;

export class WidgetDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    constructor() {
        super();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'widget');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }

    static fromJson(json: api.content.json.WidgetDescriptorJson[]): Widget[] {
        let result: Widget[] = [];
        json.forEach((widgetDescriptorJson: api.content.json.WidgetDescriptorJson) => {
            result.push(Widget.fromJson(widgetDescriptorJson));
        });
        return result;
    }
}
