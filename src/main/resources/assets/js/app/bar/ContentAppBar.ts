import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ProjectSelector} from '../project/ProjectSelector';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Project} from '../settings/data/project/Project';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContentAppBar
    extends AppBar {

    private projectSelector: ProjectSelector;

    private showIssuesDialogButton: ShowIssuesDialogButton;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.projectSelector = new ProjectSelector();
        this.showIssuesDialogButton = new ShowIssuesDialogButton();
    }

    updateSelectorValues() {
        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            this.projectSelector.setProjects(projects);
        }).catch(DefaultErrorHandler.handle);
    }

    disable() {
        this.showIssuesDialogButton.hide();
        this.projectSelector.setHeaderPrefix(`<${i18n('settings.projects.notfound')}>`);
    }

    enable() {
        this.showIssuesDialogButton.show();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            this.insertChild(this.projectSelector, 0);
            const buttonWrapper: DivEl = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(this.showIssuesDialogButton);
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
