import PageDescriptorResourceRequest = api.content.page.PageDescriptorResourceRequest;
import DescriptorKey = api.content.page.DescriptorKey;
import PageDescriptor = api.content.page.PageDescriptor;
import PageDescriptorJson = api.content.page.PageDescriptorJson;

export class GetPageDescriptorByKeyRequest
    extends PageDescriptorResourceRequest<PageDescriptorJson, PageDescriptor> {

    private key: DescriptorKey;

    constructor(key: DescriptorKey) {
        super();
        super.setMethod('GET');
        this.key = key;
    }

    getParams(): Object {
        return {
            key: this.key.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return super.getResourcePath();
    }

    sendAndParse(): wemQ.Promise<PageDescriptor> {

        let pageDescriptor = this.cache.getByKey(this.key);
        if (pageDescriptor) {
            return wemQ(pageDescriptor);
        } else {
            return this.send().then((response: api.rest.JsonResponse<PageDescriptorJson>) => {
                pageDescriptor = this.fromJsonToPageDescriptor(response.getResult(), true);
                return pageDescriptor;
            });
        }
    }
}
