import ApplicationKey = api.application.ApplicationKey;
import PageDescriptor = api.content.page.PageDescriptor;
import PageDescriptorsJson = api.content.page.PageDescriptorsJson;
import {GetPageDescriptorsByApplicationRequest} from '../../../../../resource/GetPageDescriptorsByApplicationRequest';

export class GetPageDescriptorsByApplicationsRequest
    extends api.rest.ResourceRequest<PageDescriptorsJson, PageDescriptor[]> {

    private applicationKeys: ApplicationKey[];

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    sendAndParse(): wemQ.Promise<PageDescriptor[]> {

        if (this.applicationKeys.length > 0) {
            const request = (applicationKey: ApplicationKey) => new GetPageDescriptorsByApplicationRequest(applicationKey).sendAndParse();

            const promises = this.applicationKeys.map(request);

            return wemQ.all(promises).then((results: PageDescriptor[][]) => {
                return results.reduce((prev: PageDescriptor[], curr: PageDescriptor[]) => prev.concat(curr), []);
            });
        }

        return wemQ.resolve([]);
    }
}
