import * as Q from 'q';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {GetPartDescriptorsByApplicationRequest} from '../../../../../resource/GetPartDescriptorsByApplicationRequest';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';

export class GetPartDescriptorByKeyRequest
    extends ResourceRequest<PartDescriptor> {

    private key: DescriptorKey;

    constructor(key: DescriptorKey) {
        super();
        this.key = key;
    }

    sendAndParse(): Q.Promise<PartDescriptor> {
        let deferred = Q.defer<PartDescriptor>();

        new GetPartDescriptorsByApplicationRequest(this.key.getApplicationKey()).sendAndParse()
            .then((descriptors: PartDescriptor[]) => {
                descriptors.forEach((descriptor: PartDescriptor) => {
                    if (this.key.equals(descriptor.getKey())) {
                        deferred.resolve(descriptor);
                    }
                });
            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }
}
