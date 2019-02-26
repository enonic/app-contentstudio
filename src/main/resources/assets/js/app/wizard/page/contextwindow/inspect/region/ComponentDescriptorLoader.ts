import ApplicationKey = api.application.ApplicationKey;
import Descriptor = api.content.page.Descriptor;
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';


export abstract class ComponentDescriptorLoader<JSON, DESCRIPTOR extends Descriptor>
    extends api.util.loader.BaseLoader<JSON, DESCRIPTOR> {

    protected request: GetComponentDescriptorsByApplicationsRequest<JSON, DESCRIPTOR>;

    constructor() {
        super();

        this.setComparator(new DescriptorByDisplayNameComparator());
    }

    filterFn(descriptor: Descriptor) {
        return descriptor.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.request.setApplicationKeys(applicationKeys);
    }

}
