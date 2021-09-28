import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {NewProjectEvent} from '../event/NewProjectEvent';
import {SettingsTypeListBox} from './SettingsTypeListBox';
import {SettingsType} from './SettingsType';
import {SettingsTypes} from './SettingsTypes';
import {Project} from '../data/project/Project';
import {ProjectsChainBlock} from './ProjectsChainBlock';

export class NewSettingsItemDialog
    extends ModalDialog {

    private itemsList: SettingsTypeListBox;

    private projectsChainBlock: ProjectsChainBlock;

    private projects: Project[];

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('settings.dialog.new'),
            class: 'new-settings-item-dialog'
        });
    }

    setProjectsChain(projects: Project[]) {
        this.projects = projects;
        this.toggleClass('project-selected', projects.length > 0);
        if (!projects) {
            return;
        }
        if (this.projectsChainBlock) {
            this.projectsChainBlock.reset();
        } else {
            this.projectsChainBlock = new ProjectsChainBlock();
            this.appendChildToHeader(this.projectsChainBlock);
        }
        this.projectsChainBlock.setProjectsChain(projects);
    }

    protected initElements() {
        super.initElements();

        this.itemsList = new SettingsTypeListBox();
    }

    protected initListeners() {
        super.initListeners();

        this.itemsList.onItemClicked((item: SettingsType) => {
            this.close();
            new NewProjectEvent(item, this.projects ? this.projects[this.projects.length - 1] : undefined).fire();
        });
    }

    protected postInitElements() {
        super.postInitElements();

        this.itemsList.addItems(SettingsTypes.get().getInstantiable());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.itemsList);
            this.addCancelButtonToBottom(null, true);

            return rendered;
        });
    }

    open() {
        Body.get().appendChild(this);
        super.open();
    }

    close() {
        super.close();
        this.remove();
        if (this.projectsChainBlock) {
            this.projectsChainBlock.reset();
        }
    }
}

