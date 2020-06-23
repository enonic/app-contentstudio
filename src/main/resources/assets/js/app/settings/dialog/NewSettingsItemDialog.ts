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

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('settings.dialog.new'),
            class: 'new-settings-item-dialog'
        });

        this.projectsChainBlock = new ProjectsChainBlock();
        this.projectsChainBlock.hide();
    }

    setProjectsChain(projects: Project[]) {
        this.projectsChainBlock.setProjectsChain(projects);
        if (!this.projectsChainBlock.isEmpty()) {
            this.projectsChainBlock.show();
        }
    }

    protected initElements() {
        super.initElements();

        this.itemsList = new SettingsTypeListBox();
    }

    protected initListeners() {
        super.initListeners();

        this.itemsList.onItemClicked((item: SettingsType) => {
            this.close();
            if (SettingsTypes.PROJECT.equals(item)) {
                new NewProjectEvent().fire();
            }
        });
    }

    protected postInitElements() {
        super.postInitElements();

        this.itemsList.addItem(SettingsTypes.PROJECT);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToHeader(this.projectsChainBlock);
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
        this.projectsChainBlock.reset();
        this.projectsChainBlock.hide();
    }
}

