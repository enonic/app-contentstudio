import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ProjectSelector} from '../project/ProjectSelector';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DefaultErrorHandler} from '../../../../../../../../lib-admin-ui/src/main/resources/assets/admin/common/js/DefaultErrorHandler';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class ContentAppBar
    extends AppBar {

    private projectSelector: ProjectSelector;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.projectSelector = new ProjectSelector();
        this.projectSelector.hide();
        this.updateSelectorValues();
    }

    updateSelectorValues() {
        new ProjectListRequest().sendAndParse().then((projects: ProjectItem[]) => {
            this.projectSelector.setProjects(projects);
            this.projectSelector.show();
        }).catch(DefaultErrorHandler.handle);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            this.insertChild(this.projectSelector, 0);
            const buttonWrapper: DivEl = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(new ShowIssuesDialogButton());
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
