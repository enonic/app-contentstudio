/*
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageDescriptorsJson} from 'lib-admin-ui/content/page/PageDescriptorsJson';
import {GetComponentDescriptorsRequest} from '../../../../../resource/GetComponentDescriptorsRequest';

export class GetPageDescriptorsRequest
    extends GetComponentDescriptorsRequest {

    constructor() {
        super();
        this.addRequestPathElements('pages');
    }

    protected parseResponse(response: JsonResponse<PageDescriptorsJson>): PageDescriptor[] {
        return response.getResult().descriptors.map((descJson) => PageDescriptor.fromJson(descJson));
    }
}
*/
