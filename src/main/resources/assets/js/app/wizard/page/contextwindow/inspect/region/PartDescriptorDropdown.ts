import ApplicationKey = api.application.ApplicationKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorLoader = api.content.page.region.PartDescriptorLoader;
import DescriptorBasedDropdown = api.content.page.region.DescriptorBasedDropdown;
import PartDescriptorViewer = api.content.page.region.PartDescriptorViewer;

export class PartDescriptorDropdown
    extends DescriptorBasedDropdown<PartDescriptor> {

    protected loader: PartDescriptorLoader;

    constructor() {

        super({
            optionDisplayValueViewer: new PartDescriptorViewer(),
            dataIdProperty: 'value',
            noOptionsText: 'No parts available'
        });
    }

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);

        super.load();
    }

    protected createLoader(): PartDescriptorLoader {
        return new PartDescriptorLoader();
    }
}
