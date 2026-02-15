import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {WidgetDescriptorResourceRequest} from './WidgetDescriptorResourceRequest';
import {type WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type Widget} from '@enonic/lib-admin-ui/content/Widget';

export class GetWidgetsByInterfaceRequest
    extends WidgetDescriptorResourceRequest<Widget[]> {

    private readonly widgetInterface: string;

    constructor(widgetInterface: string) {
        super();
        this.setMethod(HttpMethod.GET);
        this.widgetInterface = widgetInterface;
    }

    getParams(): object {
        return {
            widgetInterface: this.widgetInterface,
        };
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): Widget[] {
        return WidgetDescriptorResourceRequest.fromJson(response.getResult());
    }
}
