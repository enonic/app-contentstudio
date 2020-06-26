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
        return `${delimiter}${project.getDisplayName()}${language}`;
    }

    private createEmptyChainEntry(): SpanEl {
        return this.doCreateChainEntry(i18n('settings.field.project.parent.none'));
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
