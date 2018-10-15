import ApplicationKey = api.application.ApplicationKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {GetPartDescriptorsByApplicationRequest} from '../../../../../resource/GetPartDescriptorsByApplicationRequest';
import {PartDescriptorsResourceRequest} from '../../../../../resource/PartDescriptorsResourceRequest';

export class GetPartDescriptorsByApplicationsRequest extends PartDescriptorsResourceRequest {

    private applicationKeys: ApplicationKey[];

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    getParams(): Object {
        throw new Error('Unexpected call');
    }

    getRequestPath(): api.rest.Path {
        throw new Error('Unexpected call');
    }

    sendAndParse(): wemQ.Promise<PartDescriptor[]> {

        const request = (applicationKey: ApplicationKey) => new GetPartDescriptorsByApplicationRequest(applicationKey).sendAndParse();

        const promises = this.applicationKeys.map(request);

        return wemQ.all(promises).then((results: PartDescriptor[][]) => {
            let all: PartDescriptor[] = [];
            results.forEach((result: PartDescriptor[]) => {
                Array.prototype.push.apply(all, result);
            });
            return all;
        });
    }
}
