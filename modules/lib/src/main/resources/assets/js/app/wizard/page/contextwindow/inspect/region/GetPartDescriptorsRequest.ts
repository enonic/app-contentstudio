import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {SchemaFilterResourceRequest} from '../../../../../resource/SchemaFilterResourceRequest';

export class GetPartDescriptorsRequest
    extends SchemaFilterResourceRequest<PartDescriptor[]> {

    constructor() {
        super();
        this.addRequestPathElements('parts');
    }

    protected parseResponse(response: JsonResponse<PageDescriptorsJson>): PartDescriptor[] {
        return response.getResult().descriptors.map((descJson) => PartDescriptor.fromJson(descJson));
    }
}
