import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ProjectSelector} from '../project/ProjectSelector';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DefaultErrorHandler} from '../../../../../../../../lib-admin-ui/src/main/resources/assets/admin/common/js/DefaultErrorHandler';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SettingsServerEvent} from '../settings/event/SettingsServerEvent';

export class ContentAppBar
    extends AppBar {

    private projectSelector: ProjectSelector;

    constructor(application: Application) {
        super(application);

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.projectSelector = new ProjectSelector();
        this.projectSelector.hide();
        this.updateSelectorValues();
    }

    private updateSelectorValues() {
        new ProjectListRequest().sendAndParse().then((projects: ProjectItem[]) => {
            this.projectSelector.setProjects(projects);
            this.projectSelector.show();
        }).catch(DefaultErrorHandler.handle);
    }

    private initListeners() {
        SettingsServerEvent.on((event: SettingsServerEvent) => {
            this.updateSelectorValues();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            this.insertChild(this.projectSelector, 0);
            const buttonWrapper = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(new ShowIssuesDialogButton());
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
