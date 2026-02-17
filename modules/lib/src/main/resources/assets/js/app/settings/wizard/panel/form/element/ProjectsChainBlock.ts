import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Project} from '../../../../data/project/Project';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ProjectConfigContext} from '../../../../data/project/ProjectConfigContext';

export class ProjectsChainBlock
    extends H6El {

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
        const name: string = project.getName();
        return `${delimiter}${name}`;
    }

    private createEmptyChainEntry(): SpanEl {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        return this.doCreateChainEntry(i18n(isMultiInheritance ? 'settings.field.project.parents' : 'settings.field.project.parent'));
    }

    public static buildProjectsChain(parentName: string, allProjects: Project[]): Project[] {
        const parentProjects: Project[] = [];

        let parentProjectName: string = parentName;

        while (parentProjectName) {
            const parentProject: Project = allProjects.find((project: Project) => project.getName() === parentProjectName);

            if (parentProject) {
                parentProjects.unshift(parentProject);
                parentProjectName = parentProject.getMainParent();
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
