import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ProjectSelector} from '../project/ProjectSelector';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DefaultErrorHandler} from '../../../../../../../../lib-admin-ui/src/main/resources/assets/admin/common/js/DefaultErrorHandler';

export class ContentAppBar
    extends AppBar {

    private projectSelector: ProjectSelector;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.projectSelector = this.initProjectSelector();
    }

    private initProjectSelector(): ProjectSelector {
        const projectSelector: ProjectSelector = new ProjectSelector();
        projectSelector.hide();

        new ProjectListRequest().sendAndParse().then((projects: ProjectItem[]) => {
            projectSelector.setProjects(projects);
            projectSelector.show();
        }).catch(DefaultErrorHandler.handle);

        return projectSelector;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            this.insertChild(this.projectSelector, 0);

            return rendered;
        });
    }
}
