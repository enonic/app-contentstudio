import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

export class EditContentEvent
    extends Event {

    private readonly model: ContentSummaryAndCompareStatus[];

    private readonly project: Project;

    private displayAsNew: boolean = false;

    private localized: boolean = false;

    constructor(model: ContentSummaryAndCompareStatus[], project?: Project) {
        super();
        this.model = model;
        this.project = project ? project : ProjectContext.get().getProject();
    }

    setDisplayAsNew(value: boolean): EditContentEvent {
        this.displayAsNew = value;
        return this;
    }

    isDisplayAsNew(): boolean {
        return this.displayAsNew;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }

    getProject(): Project {
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
