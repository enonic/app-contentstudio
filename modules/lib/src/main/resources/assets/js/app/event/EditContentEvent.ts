import { Event } from '@enonic/lib-admin-ui/event/Event';
import { ClassHelper } from '@enonic/lib-admin-ui/ClassHelper';
import type { ContentSummary } from '../content/ContentSummary';
import type { ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { getActiveProjectName } from '../../v6/entities/project/activeProject.store';

type EditContentModel = ContentSummary | ContentSummaryAndCompareStatus;

const toContentSummary = (item: EditContentModel): ContentSummary | null => {
    if ('getContentSummary' in item) {
        return item.getContentSummary();
    }

    return item;
};

export class EditContentEvent extends Event {
    private readonly model: ContentSummary[];

    private readonly projectName: string;

    private displayAsNew: boolean = false;

    private localized: boolean = false;

    constructor(model: EditContentModel[], projectName?: string) {
        super();
        this.model = model.map(toContentSummary).filter((item): item is ContentSummary => !!item);
        this.projectName = projectName || getActiveProjectName();
    }

    setDisplayAsNew(value: boolean): EditContentEvent {
        this.displayAsNew = value;
        return this;
    }

    isDisplayAsNew(): boolean {
        return this.displayAsNew;
    }

    getModels(): ContentSummary[] {
        return this.model;
    }

    getProjectName(): string {
        return this.projectName;
    }

    setIsLocalized(value: boolean): this {
        this.localized = value;
        return this;
    }

    isLocalized(): boolean {
        return this.localized;
    }

    static on(handler: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
