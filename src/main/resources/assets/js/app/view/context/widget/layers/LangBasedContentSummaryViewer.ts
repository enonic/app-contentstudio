import {Flag} from 'lib-admin-ui/locale/Flag';
import {Project} from '../../../../settings/data/project/Project';
import {ContentSummaryAndCompareStatusViewer} from '../../../../content/ContentSummaryAndCompareStatusViewer';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';

export class LangBasedContentSummaryViewer extends ContentSummaryAndCompareStatusViewer {

    private project: Project;

    constructor(project: Project) {
        super();

        this.project = project;
    }

    resolveIconEl(object: ContentSummaryAndCompareStatus): Flag {
        const language: string = object.isInherited() ? null : object.getContentSummary().getLanguage();
        return !!language ? new Flag(language) : null;
    }

}
