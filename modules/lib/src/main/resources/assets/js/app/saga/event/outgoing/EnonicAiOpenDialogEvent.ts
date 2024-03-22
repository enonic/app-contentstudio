import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EnonicAiOpenDialogEvent
    extends Event {

    private readonly sourceDataPath?: string;

    constructor(dataPath?: string) {
        super();

        this.sourceDataPath = dataPath;
    }

    getSourceDataPath(): string | undefined {
        return this.sourceDataPath;
    }

    static on(handler: (event: EnonicAiOpenDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiOpenDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
