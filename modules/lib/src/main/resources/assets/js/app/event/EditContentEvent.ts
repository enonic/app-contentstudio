import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

export class EditContentEvent
    extends Event {

    private readonly model: ContentSummaryAndCompareStatus[];

    private readonly project: Project;

    private skipValidation: boolean = false;

    constructor(model: ContentSummaryAndCompareStatus[], project?: Project) {
        super();
        this.model = model;
        this.project = project ? project : ProjectContext.get().getProject();
    }

    setSkipValidation(value: boolean): EditContentEvent {
        this.skipValidation = value;
        return this;
    }

    isSkipValidation(): boolean {
        return this.skipValidation;
    }

    getModels(): ContentSummaryAndCompareStatus[] {
        return this.model;
    }

    getProject(): Project {
        return this.project;
    }

    static on(handler: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
