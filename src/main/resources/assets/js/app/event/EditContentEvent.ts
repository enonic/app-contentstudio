import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

export class EditContentEvent
    extends Event {

    private model: ContentSummaryAndCompareStatus[];

    private project: Project;

    constructor(model: ContentSummaryAndCompareStatus[], project?: Project) {
        super();
        this.model = model;
        this.project = project ? project : ProjectContext.get().getProject();
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
