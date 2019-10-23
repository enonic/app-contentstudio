import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Widget} from 'lib-admin-ui/content/Widget';
import {WidgetDescriptorResourceRequest} from './WidgetDescriptorResourceRequest';
import {WidgetDescriptorJson} from 'lib-admin-ui/content/json/WidgetDescriptorJson';

export class GetWidgetsByInterfaceRequest
    extends WidgetDescriptorResourceRequest<WidgetDescriptorJson[], any> {

    private widgetInterfaces: string[];

    constructor(widgetInterfaces: string[]) {
        super();
        super.setMethod('POST');
        this.widgetInterfaces = widgetInterfaces;
    }

    getParams(): Object {
        return this.widgetInterfaces;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'list/byinterfaces');
    }

    sendAndParse(): Q.Promise<Widget[]> {

        return this.send().then((response: JsonResponse<WidgetDescriptorJson[]>) => {
            return WidgetDescriptorResourceRequest.fromJson(response.getResult());
        });
    }
}
