import ApplicationKey = api.application.ApplicationKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import {GetPartDescriptorsByApplicationRequest} from '../../../../../resource/GetPartDescriptorsByApplicationRequest';

export class GetPartDescriptorsByApplicationsRequest
    extends api.rest.ResourceRequest<PartDescriptorsJson, PartDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    sendAndParse(): wemQ.Promise<PartDescriptor[]> {

        if (this.applicationKeys.length > 0) {

            const request = (applicationKey: ApplicationKey) => new GetPartDescriptorsByApplicationRequest(applicationKey).sendAndParse();

            const promises = this.applicationKeys.map(request);

            return wemQ.all(promises).then((results: PartDescriptor[][]) => {
                return results.reduce((prev: PartDescriptor[], curr: PartDescriptor[]) => prev.concat(curr), []);
            });
        }

        return wemQ.resolve([]);
    }
}
