import {Flag} from 'lib-admin-ui/locale/Flag';
import {Project} from '../../../../settings/data/project/Project';
import {ContentSummaryAndCompareStatusViewer} from '../../../../content/ContentSummaryAndCompareStatusViewer';
import {ProjectIconUrlResolver} from '../../../../project/ProjectIconUrlResolver';

export class LangBasedContentSummaryViewer extends ContentSummaryAndCompareStatusViewer {

    private readonly project: Project;

    constructor(project: Project) {
        super();

        this.project = project;
    }

    resolveIconUrl(): string {
        return null;
    }

    resolveIconClass(): string {
        return ProjectIconUrlResolver.getDefaultIcon(this.project);
    }

    resolveIconEl(): Flag {
        const language = this.project.getLanguage();
        return !!language ? new Flag(language) : null;
    }

}
