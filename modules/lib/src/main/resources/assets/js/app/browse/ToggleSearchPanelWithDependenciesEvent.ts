import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummary} from '../content/ContentSummary';
import {Branch} from '../versioning/Branch';

export interface ToggleSearchPanelWithDependenciesConfig {
    item: ContentSummary;
    inbound: boolean;
    branch?: Branch;
    type?: string;
}

export class ToggleSearchPanelWithDependenciesEvent
    extends Event {

    private readonly item: ContentSummary;

    private readonly inbound: boolean;

    private readonly type: string;

    private readonly branch: Branch;

    constructor(config: ToggleSearchPanelWithDependenciesConfig) {
        super();

        this.item = config.item;
        this.inbound = config.inbound;
        this.type = config.type;
        this.branch = config.branch || Branch.DRAFT;
    }

    getContent(): ContentSummary {
        return this.item;
    }

    isInbound(): boolean {
        return this.inbound;
    }

    getType(): string {
        return this.type;
    }

    getBranch(): Branch {
        return this.branch;
    }

    static on(handler: (event: ToggleSearchPanelWithDependenciesEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ToggleSearchPanelWithDependenciesEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
