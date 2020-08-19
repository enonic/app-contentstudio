import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import * as Q from 'q';
import {Project} from '../../../../settings/data/project/Project';
import {ProjectContext} from '../../../../project/ProjectContext';
import {ProjectListRequest} from '../../../../settings/resource/ProjectListRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentsExistRequest} from '../../../../resource/ContentsExistRequest';
import {ContentsExistResult} from '../../../../resource/ContentsExistResult';
import {LayerContent} from './LayerContent';

export class MultiLayersContentLoader {

    private originalItem: ContentSummaryAndCompareStatus;

    private items: LayerContent[];

    private loadPromise: Q.Deferred<LayerContent[]>;

    private projects: Project[];

    constructor(item: ContentSummaryAndCompareStatus) {
        this.originalItem = item;
    }

    load(): Q.Promise<LayerContent[]> {
        this.items = [];
        this.loadPromise = Q.defer<LayerContent[]>();

        this.loadSameContentInOtherProjects();

        return this.loadPromise.promise;
    }

    private resolveLoad() {
        this.loadPromise.resolve(this.items);
    }

    private rejectLoad(reason: any) {
        this.loadPromise.reject(reason);
    }

    private loadSameContentInOtherProjects() {
        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            const currentProjectName: string = ProjectContext.get().getProject().getName();
            const currentProject: Project = projects.find((project: Project) => project.getName() === currentProjectName);

            this.items.push(new LayerContent(this.originalItem, currentProject));

            if (!currentProject.getParent()) {
                this.resolveLoad();
                return;
            }

            this.projects = projects;
            this.loadContentFromProject(currentProject.getParent());
        }).catch(this.rejectLoad.bind(this));
    }

    private loadContentFromProject(name: string) {
        const parentProject: Project = this.projects.find((project: Project) => project.getName() === name);

        if (parentProject) {
            this.doLoadContentFromProject(parentProject);
        } else {
            this.resolveLoad();
        }
    }

    private doLoadContentFromProject(project: Project) {
        const id: string = this.originalItem.getId();

        new ContentsExistRequest([id])
            .setRequestProject(project)
            .sendAndParse()
            .then((result: ContentsExistResult) => {
                if (!!result.getContentsExistMap()[id]) {
                    ContentSummaryAndCompareStatusFetcher.fetch(this.originalItem.getContentId(), project)
                        .then((item: ContentSummaryAndCompareStatus) => {
                            const layerContent: LayerContent = new LayerContent(item, project);
                            this.items.unshift(layerContent);
                            this.loadContentFromProject(project.getParent());
                        }).catch(this.rejectLoad.bind(this));
                } else {
                    this.resolveLoad();
                }

            }).catch(this.rejectLoad.bind(this));
    }
}
