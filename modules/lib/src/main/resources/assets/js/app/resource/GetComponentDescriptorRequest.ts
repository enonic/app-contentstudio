import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class GetComponentDescriptorRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private readonly descriptor: string;

    constructor(descriptor: string, componentType: string) {
        super();
        this.descriptor = descriptor;
        this.addRequestPathElements('content', 'page', componentType, 'descriptor');
    }

    getParams(): Object {
        return {
            key: this.descriptor
        };
    }
}
