import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {WidgetDescriptorResourceRequest} from './WidgetDescriptorResourceRequest';
import {WidgetDescriptorJson} from 'lib-admin-ui/content/json/WidgetDescriptorJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetWidgetsByInterfaceRequest
    extends WidgetDescriptorResourceRequest<any> {

    private widgetInterfaces: string[];

    constructor(widgetInterfaces: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.widgetInterfaces = widgetInterfaces;
        this.addRequestPathElements('list', 'byinterfaces');
    }

    getParams(): Object {
        return this.widgetInterfaces;
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): any {
        return WidgetDescriptorResourceRequest.fromJson(response.getResult());
    }
}
