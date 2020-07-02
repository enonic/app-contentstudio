import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Project} from '../settings/data/project/Project';
import {ProjectViewer} from '../settings/wizard/viewer/ProjectViewer';
import {ProjectContext} from '../project/ProjectContext';
import {ProjectChangedEvent} from '../project/ProjectChangedEvent';
import {ProjectSelectionDialog} from '../settings/dialog/ProjectSelectionDialog';
import {ProjectGetRequest} from '../settings/resource/ProjectGetRequest';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContentAppBar
    extends AppBar {

    private selectedProjectViewer: ProjectViewer;

    private showIssuesDialogButton: ShowIssuesDialogButton;

    constructor(application: Application) {
        super(application);

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.selectedProjectViewer = new ProjectViewer();
        this.showIssuesDialogButton = new ShowIssuesDialogButton();
    }

    private initListeners() {
        this.selectedProjectViewer.onClicked(() => {
            ProjectSelectionDialog.get().open();
        });


        ProjectChangedEvent.on(() => {
            this.updateSelectedProjectValue();
        });
    }

    updateSelectedProjectValue() {
        if (!ProjectContext.get().isInitialized()) {
            return;
        }

        new ProjectGetRequest(ProjectContext.get().getProject()).sendAndParse().then((project: Project) => {
            this.selectedProjectViewer.setObject(project);
        }).catch(DefaultErrorHandler.handle);

    }

    disable() {
        this.showIssuesDialogButton.hide();
        this.selectedProjectViewer.setObject(Project.create().setDisplayName(`<${i18n('settings.projects.notfound')}>`).build());
        this.selectedProjectViewer.addClass('no-project');
    }

    enable() {
        this.showIssuesDialogButton.show();
        this.selectedProjectViewer.removeClass('no-project');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('appbar-content');
            this.insertChild(this.selectedProjectViewer, 0);
            const buttonWrapper: DivEl = new DivEl('show-issues-button-wrapper');
            buttonWrapper.appendChild(this.showIssuesDialogButton);
            this.appendChild(buttonWrapper);

            return rendered;
        });
    }
}
