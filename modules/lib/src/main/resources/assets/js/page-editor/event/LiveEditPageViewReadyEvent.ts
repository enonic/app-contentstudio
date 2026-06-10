import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export interface LiveEditComponentRecord {
    path: ComponentPath;
    type: string;
    parentPath?: string;
    children: readonly string[];
    empty: boolean;
    error: boolean;
    descriptor?: string;
    loading: boolean;
}

export class LiveEditPageViewReadyEvent
    extends IframeEvent {

    constructor() {
        super();
    }

    getComponents(): LiveEditComponentRecord[] {
        const data = this.getData();
        if (data == null || !('components' in data)) {
            return [];
        }

        const {components} = data;
        return Array.isArray(components) ? components : [];
    }

    static on(handler: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
