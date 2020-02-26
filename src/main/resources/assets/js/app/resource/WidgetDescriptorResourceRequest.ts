import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Widget} from 'lib-admin-ui/content/Widget';
import {WidgetDescriptorJson} from 'lib-admin-ui/content/json/WidgetDescriptorJson';

export class WidgetDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'widget');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }

    static fromJson(json: WidgetDescriptorJson[]): Widget[] {
        let result: Widget[] = [];
        json.forEach((widgetDescriptorJson: WidgetDescriptorJson) => {
            result.push(Widget.fromJson(widgetDescriptorJson));
        });
        return result;
    }
}
