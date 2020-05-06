import * as Q from 'q';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {LayoutDescriptorJson} from 'lib-admin-ui/content/page/region/LayoutDescriptorJson';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {GetLayoutDescriptorsByApplicationRequest} from '../../../../../resource/GetLayoutDescriptorsByApplicationRequest';
import {LayoutDescriptorResourceRequest} from '../../../../../resource/LayoutDescriptorResourceRequest';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class GetLayoutDescriptorByKeyRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptor> {

    private key: DescriptorKey;

    constructor(key: DescriptorKey) {
        super();
        this.key = key;
    }

    setKey(key: DescriptorKey) {
        this.key = key;
    }

    getParams(): Object {
        throw new Error('Unexpected call');
    }

    sendAndParse(): Q.Promise<LayoutDescriptor> {
        let deferred = Q.defer<LayoutDescriptor>();

        new GetLayoutDescriptorsByApplicationRequest(this.key.getApplicationKey()).sendAndParse()
            .then((descriptors: LayoutDescriptor[]) => {
                descriptors.forEach((descriptor: LayoutDescriptor) => {
                    if (this.key.equals(descriptor.getKey())) {
                        deferred.resolve(descriptor);
                    }
                });
            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();

        return deferred.promise;
    }

    protected parseResponse(response: JsonResponse<LayoutDescriptorJson>): LayoutDescriptor {
        return null;
    }
}
