import Descriptor = api.content.page.Descriptor;
import ApplicationKey = api.application.ApplicationKey;
import ResourceRequest = api.rest.ResourceRequest;

export abstract class GetComponentDescriptorsByApplicationsRequest<JSON, DESCRIPTOR extends Descriptor>
    extends api.rest.ResourceRequest<JSON, DESCRIPTOR[]> {

    private applicationKeys: ApplicationKey[];

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.applicationKeys = applicationKeys;
    }

    sendAndParse(): wemQ.Promise<DESCRIPTOR[]> {

        if (this.applicationKeys.length > 0) {

            const request = (appKey: ApplicationKey) => this.createGetDescriptorsByApplicationRequest(appKey).sendAndParse();

            const promises = this.applicationKeys.map(request);

            return wemQ.all(promises).then((results: DESCRIPTOR[][]) => {
                return results.reduce((prev: DESCRIPTOR[], curr: DESCRIPTOR[]) => prev.concat(curr), []);
            });
        }

        return wemQ.resolve([]);
    }

    protected abstract createGetDescriptorsByApplicationRequest(applicationKey: ApplicationKey): ResourceRequest<JSON, DESCRIPTOR[]>;
}
