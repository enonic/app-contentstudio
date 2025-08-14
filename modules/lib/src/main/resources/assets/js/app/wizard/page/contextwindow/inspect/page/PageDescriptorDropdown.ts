import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {Descriptor} from '../../../../../page/Descriptor';
import {ComponentDescriptorsDropdown} from '../region/ComponentDescriptorsDropdown';
import {PageComponentType} from '../../../../../page/region/PageComponentType';
import {ContentId} from '../../../../../content/ContentId';
import Q from 'q';

export class PageDescriptorDropdown
    extends ComponentDescriptorsDropdown {

    constructor(contentId?: ContentId) {
        super();

        this.setComponentType(PageComponentType.get());

        if (contentId) {
            this.setContentId(contentId);
        }
    }

    onLoadedData(listener: (event: LoadedDataEvent<Descriptor>) => Q.Promise<void>) {
        this.loader.onLoadedData(listener);
    }

    unLoadedData(listener: (event: LoadedDataEvent<Descriptor>) => Q.Promise<void>) {
        this.loader.unLoadedData(listener);
    }

}
