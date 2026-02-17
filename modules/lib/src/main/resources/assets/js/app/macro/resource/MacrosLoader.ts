import Q from 'q';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {type MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {GetMacrosRequest} from './GetMacrosRequest';

export class MacrosLoader
    extends BaseLoader<MacroDescriptor> {

    declare protected request: GetMacrosRequest;
    private hasRelevantData: boolean;

    constructor() {
        super();

        this.hasRelevantData = false;

        ApplicationEvent.on((event: ApplicationEvent) => {
            if (event.getEventType() === ApplicationEventType.STARTED || event.getEventType() === ApplicationEventType.STOPPED ||
                event.getEventType() === ApplicationEventType.UPDATED) {
                this.invalidate();
            }
        });
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.getRequest().setApplicationKeys(applicationKeys);
    }

    load(): Q.Promise<MacroDescriptor[]> {

        this.notifyLoadingData();

        if (this.hasRelevantData) {
            this.notifyLoadedData(this.getResults());
            return Q(this.getResults());
        }

        return this.sendRequest()
            .then((macros: MacroDescriptor[]) => {
                this.notifyLoadedData(macros);
                this.hasRelevantData = true;
                this.setResults(macros);
                return macros;
            });
    }

    search(searchString: string): Q.Promise<MacroDescriptor[]> {
        if (this.hasRelevantData) {
            return super.search(searchString);
        } else {
            return this.load().then(() => {
                return super.search(searchString);
            });
        }
    }

    filterFn(macro: MacroDescriptor) {
        return macro.getDisplayName().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    protected createRequest(): GetMacrosRequest {
        return new GetMacrosRequest();
    }

    protected getRequest(): GetMacrosRequest {
        return this.request;
    }

    private invalidate() {
        this.hasRelevantData = false;
    }

}

