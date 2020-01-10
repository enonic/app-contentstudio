import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Element} from 'lib-admin-ui/dom/Element';
import {ProjectSelector} from '../project/ProjectSelector';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DefaultErrorHandler} from '../../../../../../../../lib-admin-ui/src/main/resources/assets/admin/common/js/DefaultErrorHandler';

export class ContentAppBar
    extends AppBar {

    private projectInfoBlock: DivEl;

    private projectSelector: ProjectSelector;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.projectInfoBlock = new DivEl('name-block');
        this.projectSelector = this.initProjectSelector();
    }

    private initProjectSelector(): ProjectSelector {
        const projectSelector: ProjectSelector = new ProjectSelector();
        projectSelector.hide();

        new ProjectListRequest().sendAndParse().then((projects: ProjectItem[]) => {
            projectSelector.setProjects(projects);
            if (projects.length > 1) {
                projectSelector.show();
            }
        }).catch(DefaultErrorHandler.handle);

        return projectSelector;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            const project: Element = new SpanEl('label').setHtml('Project');
            const projectName: Element = new SpanEl('name').setHtml('Default');
            this.projectInfoBlock.appendChildren(project, projectName);
            this.insertChild(this.projectInfoBlock, 0);
            this.insertChild(this.projectSelector, 1);

            return rendered;
        });
    }
}
