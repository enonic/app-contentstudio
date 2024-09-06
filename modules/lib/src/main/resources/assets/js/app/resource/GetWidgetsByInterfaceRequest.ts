import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {WidgetDescriptorResourceRequest} from './WidgetDescriptorResourceRequest';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';

export class GetWidgetsByInterfaceRequest
    extends WidgetDescriptorResourceRequest<Widget[]> {

    private widgetInterfaces: string[];

    constructor(widgetInterfaces: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.widgetInterfaces = widgetInterfaces;
        this.addRequestPathElements('list', 'byinterfaces');
    }

    getParams(): object {
        return this.widgetInterfaces;
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): Widget[] {
        return WidgetDescriptorResourceRequest.fromJson(response.getResult());
    }
}
