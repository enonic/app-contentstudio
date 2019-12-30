import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {DescriptorByDisplayNameComparator} from '../DescriptorByDisplayNameComparator';
import {GetComponentDescriptorsByApplicationsRequest} from './GetComponentDescriptorsByApplicationsRequest';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';

export abstract class ComponentDescriptorLoader<JSON, DESCRIPTOR extends Descriptor>
    extends BaseLoader<JSON, DESCRIPTOR> {

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
