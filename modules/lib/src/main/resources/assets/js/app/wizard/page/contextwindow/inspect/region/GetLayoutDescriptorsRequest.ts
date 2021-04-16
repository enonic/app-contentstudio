import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {SchemaFilterResourceRequest} from '../../../../../resource/GetComponentDescriptorsRequest';
/*
export class GetLayoutDescriptorsRequest
    extends SchemaFilterResourceRequest<LayoutDescriptor[]> {

    constructor() {
        super();
        this.addRequestPathElements('layouts');
    }

    protected parseResponse(response: JsonResponse<PageDescriptorsJson>): LayoutDescriptor[] {
        return response.getResult().descriptors.map((descJson) => LayoutDescriptor.fromJson(descJson));
    }
}
*/
