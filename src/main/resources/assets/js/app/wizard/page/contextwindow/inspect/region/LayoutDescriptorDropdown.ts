import DescriptorBasedDropdown = api.content.page.region.DescriptorBasedDropdown;
import LayoutDescriptorLoader = api.content.page.region.LayoutDescriptorLoader;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorViewer = api.content.page.region.LayoutDescriptorViewer;
import ApplicationKey = api.application.ApplicationKey;

export class LayoutDescriptorDropdown
    extends DescriptorBasedDropdown<LayoutDescriptor> {

    protected loader: LayoutDescriptorLoader;

    constructor() {

        super({
            optionDisplayValueViewer: new LayoutDescriptorViewer(),
            dataIdProperty: 'value',
            noOptionsText: 'No layouts available'
        });
    }

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);

        super.load();
    }

    protected createLoader(): LayoutDescriptorLoader {
        return new LayoutDescriptorLoader();
    }
}
