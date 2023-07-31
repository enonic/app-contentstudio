import {PageUpdatedEvent} from './PageUpdatedEvent';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export class PageConfigUpdatedEvent extends PageUpdatedEvent {

    private readonly pageConfig: PropertyTree;

    constructor(pageConfig: PropertyTree) {
        super();

        this.pageConfig = pageConfig;
    }

    getPageConfig(): PropertyTree {
        return this.pageConfig;
    }
}
