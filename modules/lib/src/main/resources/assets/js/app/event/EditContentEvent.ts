import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import type {ContentSummary} from '../content/ContentSummary';
import type {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

type EditContentModel = ContentSummary | ContentSummaryAndCompareStatus;

const toContentSummary = (item: EditContentModel): ContentSummary | null => {
    if ('getContentSummary' in item) {
        return item.getContentSummary();
    }

    return item;
};

export class EditContentEvent
    extends Event {

    private readonly model: ContentSummary[];

    private readonly project: Readonly<Project>;

    private displayAsNew: boolean = false;

    private localized: boolean = false;

    constructor(model: EditContentModel[], project?: Readonly<Project>) {
        super();
        this.model = model
            .map(toContentSummary)
            .filter((item): item is ContentSummary => !!item);
        this.project = project ? project : ProjectContext.get().getProject();
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

    getProject(): Readonly<Project> {
        return this.project;
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
