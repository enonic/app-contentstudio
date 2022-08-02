import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Project} from '../data/project/Project';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ProjectHelper} from '../data/project/ProjectHelper';

export class ProjectsChainBlock extends H6El {

    private readonly title: SpanEl;

    private readonly chainItems: DivEl;

    private projectsChain: Project[] = [];

    private static separator: string = '/';

    constructor() {
        super('projects-chain');

        this.title = new SpanEl('title');
        this.chainItems = new DivEl('items');
    }

    setProjectsChain(projects: Project[] = []) {
        this.projectsChain = projects;
        this.chainItems.removeChildren();

        if (projects.length > 0) {
            this.projectsChain.forEach((project: Project, index: number) => {
                this.chainItems.appendChild(this.createChainEntry(project, index));
            });
        } else {
            this.chainItems.appendChild(this.createEmptyChainEntry());
        }

    }

    private createChainEntry(project: Project, index: number): SpanEl {
        return this.doCreateChainEntry(this.generateChainEntryText(project, index));
    }

    private doCreateChainEntry(text: string): SpanEl {
        const item: SpanEl = new SpanEl('item');

        item.setHtml(text);

        return item;
    }

    private generateChainEntryText(project: Project, index: number): string {
        const delimiter: string = index > 0 ? `${ProjectsChainBlock.separator} ` : '';
        const language: string = !!project.getLanguage() ? ` (${project.getLanguage()})` : '';
        const name: string = ProjectHelper.isAvailable(project) ? project.getDisplayName() : project.getName();
        return `${delimiter}${name}${language}`;
    }

    private createEmptyChainEntry(): SpanEl {
        return this.doCreateChainEntry(i18n('settings.field.project.parent.none'));
    }

    public static buildProjectsChain(parentName: string, allProjects: Project[]): Project[] {
        const parentProjects: Project[] = [];

        let parentProjectName: string = parentName;

        while (parentProjectName) {
            const parentProject: Project = allProjects.find((project: Project) => project.getName() === parentProjectName);

            if (parentProject) {
                parentProjects.unshift(parentProject);
                parentProjectName = parentProject.getParent();
            } else {
                parentProjectName = null;
            }
        }

        return parentProjects;
    }

    isEmpty(): boolean {
        return this.projectsChain.length === 0;
    }

    reset() {
        this.projectsChain = [];
        this.chainItems.removeChildren();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.title.setHtml(`${i18n('settings.dialog.new.projectschain.title')}:`);
            this.appendChild(this.title);
            this.appendChild(this.chainItems);

            return rendered;
        });
    }
}
