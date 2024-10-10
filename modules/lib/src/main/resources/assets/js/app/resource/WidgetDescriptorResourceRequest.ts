import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {CmsResourceRequest} from './CmsResourceRequest';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export abstract class WidgetDescriptorResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return CONFIG.getString('widgetApiUrl');
    }

    constructor() {
        super();
    }

    static fromJson(json: WidgetDescriptorJson[]): Widget[] {
        let result: Widget[] = [];
        json.forEach((widgetDescriptorJson: WidgetDescriptorJson) => {
            result.push(Widget.fromJson(widgetDescriptorJson));
        });
        return result;
    }
}
