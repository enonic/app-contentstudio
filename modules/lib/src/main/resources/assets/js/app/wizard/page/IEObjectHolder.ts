import {Regions} from '../../page/region/Regions';
import {IEObjectProcessor} from './IEObjectProcessor';
import {Descriptor} from '../../page/Descriptor';
import {RegionJson} from '../../page/region/RegionJson';
import {DescriptorJson} from '../../page/DescriptorJson';

export class IEObjectHolder {

    private objectsProcessor: IEObjectProcessor = new IEObjectProcessor();

    private regionsCopy: RegionJson[];

    private pageDescriptorCopy: DescriptorJson;

    setRegions(regions: Regions) {
        this.regionsCopy = !!regions ? this.objectsProcessor.copyRegions(regions) : null;
    }

    setController(pageDescriptor: Descriptor) {
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

    getPageDescriptorCopy(): Descriptor {
        return this.objectsProcessor.restorePageDescriptorFromCopy(this.pageDescriptorCopy);
    }

    reset() {
        this.objectsProcessor = new IEObjectProcessor();
        this.regionsCopy = null;
        this.pageDescriptorCopy = null;
    }
}
