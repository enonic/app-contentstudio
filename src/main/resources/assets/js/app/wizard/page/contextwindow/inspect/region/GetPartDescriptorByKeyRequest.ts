import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorJson = api.content.page.region.PartDescriptorJson;
import {GetPartDescriptorsByApplicationRequest} from '../../../../../resource/GetPartDescriptorsByApplicationRequest';

export class GetPartDescriptorByKeyRequest
    extends api.rest.ResourceRequest<PartDescriptorJson, PartDescriptor> {

    private key: api.content.page.DescriptorKey;

    constructor(key: api.content.page.DescriptorKey) {
        super();
        this.key = key;
    }

    sendAndParse(): wemQ.Promise<PartDescriptor> {
        let deferred = wemQ.defer<PartDescriptor>();

        new GetPartDescriptorsByApplicationRequest(this.key.getApplicationKey()).sendAndParse()
            .then((descriptors: PartDescriptor[]) => {
                descriptors.forEach((descriptor: PartDescriptor) => {
                    if (this.key.equals(descriptor.getKey())) {
                        deferred.resolve(descriptor);
                    }
                });
            }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }
}
