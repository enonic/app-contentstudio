import {Widget} from 'lib-admin-ui/content/Widget';
import {WidgetDescriptorJson} from 'lib-admin-ui/content/json/WidgetDescriptorJson';
import {ResourceRequestAdvanced} from '../wizard/ResourceRequestAdvanced';

export abstract class WidgetDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('widget');
    }

    static fromJson(json: WidgetDescriptorJson[]): Widget[] {
        let result: Widget[] = [];
        json.forEach((widgetDescriptorJson: WidgetDescriptorJson) => {
            result.push(Widget.fromJson(widgetDescriptorJson));
        });
        return result;
    }
}
