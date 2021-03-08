import {Regions} from '../../page/region/Regions';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {IEObjectProcessor} from './IEObjectProcessor';

export class IEObjectHolder {

    private objectsProcessor: IEObjectProcessor = new IEObjectProcessor();

    private regionsCopy: any;

    private pageDescriptorCopy: any;

    setRegions(regions: Regions) {
        this.regionsCopy = !!regions ? this.objectsProcessor.copyRegions(regions) : null;
    }

    setController(pageDescriptor: PageDescriptor) {
        this.pageDescriptorCopy = !!pageDescriptor ? this.objectsProcessor.copyPageDescriptor(pageDescriptor) : null;
    }

    hasRegionsCopy(): boolean {
        return !!this.regionsCopy;
    }

    hasController(): boolean {
        return !!this.pageDescriptorCopy;
    }

    getRegionsCopy(): Regions {
        return this.objectsProcessor.restoreRegionsFromCopy(this.regionsCopy);
    }

    getPageDescriptorCopy(): PageDescriptor {
        return this.objectsProcessor.restorePageDescriptorFromCopy(this.pageDescriptorCopy);
    }

    reset() {
        this.objectsProcessor = new IEObjectProcessor();
        this.regionsCopy = null;
        this.pageDescriptorCopy = null;
    }
}
