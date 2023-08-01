import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {DescriptorViewer} from '../DescriptorViewer';
import {Descriptor} from '../../../../../page/Descriptor';
import {ComponentDescriptorsDropdown} from '../region/ComponentDescriptorsDropdown';
import {PageComponentType} from '../../../../../page/region/PageComponentType';
import {ContentId} from '../../../../../content/ContentId';

export class PageDescriptorDropdown
    extends ComponentDescriptorsDropdown {

    private loadedDataListeners: ((event: LoadedDataEvent<Descriptor>) => void)[];

    constructor(contentId: ContentId) {
        super({
            optionDisplayValueViewer: new DescriptorViewer(),
            dataIdProperty: 'value'
        }, 'page-controller');

        this.setComponentType(PageComponentType.get()).setContentId(contentId);
        this.loadedDataListeners = [];
    }

    handleLoadedData(event: LoadedDataEvent<Descriptor>) {
        super.handleLoadedData(event);
        this.notifyLoadedData(event);
    }

    onLoadedData(listener: (event: LoadedDataEvent<Descriptor>) => void) {
        this.loadedDataListeners.push(listener);
    }

    unLoadedData(listener: (event: LoadedDataEvent<Descriptor>) => void) {
        this.loadedDataListeners =
            this.loadedDataListeners.filter((currentListener: (event: LoadedDataEvent<Descriptor>) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyLoadedData(event: LoadedDataEvent<Descriptor>) {
        this.loadedDataListeners.forEach((listener: (event: LoadedDataEvent<Descriptor>) => void) => {
            listener.call(this, event);
        });
    }

}
