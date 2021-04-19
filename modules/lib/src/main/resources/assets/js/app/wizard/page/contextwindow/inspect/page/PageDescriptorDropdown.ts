import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {LoadedDataEvent} from 'lib-admin-ui/util/loader/event/LoadedDataEvent';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {SetController} from '../../../../../../page-editor/PageModel';
import {ApplicationRemovedEvent} from '../../../../../site/ApplicationRemovedEvent';
import {DescriptorViewer} from '../DescriptorViewer';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {Descriptor} from '../../../../../page/Descriptor';
import {ComponentDescriptorsDropdown} from '../region/ComponentDescriptorsDropdown';

export class PageDescriptorDropdown
    extends ComponentDescriptorsDropdown {

    private loadedDataListeners: { (event: LoadedDataEvent<Descriptor>): void }[];

    private liveEditModel: LiveEditModel;

    constructor(model: LiveEditModel) {
        super({
            optionDisplayValueViewer: new DescriptorViewer(),
            dataIdProperty: 'value'
        }, 'page-controller');

        this.loadedDataListeners = [];
        this.liveEditModel = model;

        this.initListeners();
    }

    handleLoadedData(event: LoadedDataEvent<Descriptor>) {
        super.handleLoadedData(event);
        this.notifyLoadedData(event);
    }

    private initListeners() {
        this.onOptionSelected(this.handleOptionSelected.bind(this));

        // debounce it in case multiple apps were added at once using checkboxes
        const onApplicationAddedHandler = AppHelper.debounce(() => this.load(), 100);

        const onApplicationRemovedHandler = AppHelper.debounce((event: ApplicationRemovedEvent) => {

            let currentController = this.liveEditModel.getPageModel().getController();
            let removedApp = event.getApplicationKey();
            if (currentController && removedApp.equals(currentController.getKey().getApplicationKey())) {
                // no need to load as current controller's app was removed
                this.liveEditModel.getPageModel().reset();
            } else {
                this.load();
            }
        }, 100);

        this.liveEditModel.getSiteModel().onApplicationAdded(onApplicationAddedHandler);

        this.liveEditModel.getSiteModel().onApplicationRemoved(onApplicationRemovedHandler);

        this.onRemoved(() => {
            this.liveEditModel.getSiteModel().unApplicationAdded(onApplicationAddedHandler);
            this.liveEditModel.getSiteModel().unApplicationRemoved(onApplicationRemovedHandler);
        });
    }

    protected handleOptionSelected(event: OptionSelectedEvent<Descriptor>) {
        let pageDescriptor = event.getOption().getDisplayValue();
        let setController = new SetController(this).setDescriptor(pageDescriptor);
        this.liveEditModel.getPageModel().setController(setController);
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
