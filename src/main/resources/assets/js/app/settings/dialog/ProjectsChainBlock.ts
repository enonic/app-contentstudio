import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Project} from '../data/project/Project';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {H6El} from 'lib-admin-ui/dom/H6El';

export class ProjectsChainBlock extends H6El {

    private title: SpanEl;

    private chainItems: DivEl;

    private projectsChain: Project[] = [];

    private static separator: string = '/';

    constructor() {
        super('projects-chain');

        this.title = new SpanEl('title');
        this.chainItems = new DivEl('items');
    }

    setProjectsChain(projects: Project[] = []) {
        this.projectsChain = projects;

        this.projectsChain.forEach((project: Project, index: number) => {
            this.chainItems.appendChild(this.createChainEntry(project, index));
        });
    }

    private createChainEntry(project: Project, index: number): SpanEl {
        const item: SpanEl = new SpanEl('item');

        item.setHtml(this.generateChainEntryText(project, index));

        return item;
    }

    private generateChainEntryText(project: Project, index: number): string {
        const delimiter: string = index > 0 ? `${ProjectsChainBlock.separator} ` : '';
        const language: string = !!project.getLanguage() ? ` (${project.getLanguage()})` : '';
        return `${delimiter}${project.getDisplayName()}${language}`;
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
