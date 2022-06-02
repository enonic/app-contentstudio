import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';
import {RegionsDescriptorJson} from './RegionsDescriptorJson';

export interface DescriptorJson {

    key: string;

    name: string;

    displayName: string;

    description: string;

    controller: string;

    config: FormJson;

    icon: string;

    regions: RegionsDescriptorJson[];
}
