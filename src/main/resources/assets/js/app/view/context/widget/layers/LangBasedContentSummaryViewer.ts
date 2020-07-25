import {ContentSummaryViewer} from 'lib-admin-ui/content/ContentSummaryViewer';
import {Flag} from 'lib-admin-ui/locale/Flag';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Project} from '../../../../settings/data/project/Project';

export class LangBasedContentSummaryViewer extends ContentSummaryViewer {

    private project: Project;

    constructor(project: Project) {
        super();

        this.project = project;
    }

    resolveIconEl(object: ContentSummary): Flag {
        const language: string = object.isInherited() ? this.project.getLanguage() : object.getLanguage();
        return new Flag(language);
    }

}
