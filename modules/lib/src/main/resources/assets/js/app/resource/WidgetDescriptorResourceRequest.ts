import {Widget} from 'lib-admin-ui/content/Widget';
import {WidgetDescriptorJson} from 'lib-admin-ui/content/json/WidgetDescriptorJson';
import {CmsResourceRequest} from './CmsResourceRequest';

export abstract class WidgetDescriptorResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

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
