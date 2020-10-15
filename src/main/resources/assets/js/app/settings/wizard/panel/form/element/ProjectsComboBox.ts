import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import * as Q from 'q';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ProjectsChainBlock} from '../../../../dialog/ProjectsChainBlock';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {ComboBoxConfig} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {ProjectOptionDataLoader} from './ProjectOptionDataLoader';

export class ProjectsComboBox extends RichComboBox<Project> {

    private projectsChainBlock: ProjectsChainBlock;

    private helper: ProjectOptionDataHelper;

    constructor(builder: ProjectsDropdownBuilder = new ProjectsDropdownBuilder()) {
        super(builder);

        this.projectsChainBlock = new ProjectsChainBlock();
        this.helper = builder.optionDataHelper;

        this.getLoader().onLoadedData(() => {
            this.helper.setProjects(this.getLoader().getResults());
            return Q(null);
        });
    }

    protected createOption(project: Project): Option<Project> {
        return {
            value: project.getName(),
            displayValue: project,
            expandable: this.helper.isExpandable(project),
            selectable: this.helper.isSelectable(project)
        };
    }

    protected createOptions(items: any[]): Q.Promise<Option<Project>[]> {
        return super.createOptions(items.filter((item: Project) => !item.getParent()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('parent-selector');

            return rendered;
        });
    }

    selectProject(project: Project) {
        if (!project) {
            return;
        }

        this.selectOption(this.createOption(project));
    }

    showProjectsChain(parentName?: string) {
        if (!parentName) {
            this.doShowProjectsChain([]);
            return;
        }

        this.getAllProjects().then((projects: Project[]) => {
            const projectsChain: Project[] = ProjectsChainBlock.buildProjectsChain(parentName, projects);
            this.doShowProjectsChain(projectsChain);
        }).catch(DefaultErrorHandler.handle);
    }

    private doShowProjectsChain(projects: Project[]) {
        this.projectsChainBlock.setProjectsChain(projects);
        this.prependChild(this.projectsChainBlock);
    }

    private getAllProjects(): Q.Promise<Project[]> {
        if (this.getLoader().isLoaded()) {
            return Q(this.getLoader().getResults());
        }

        return this.getLoader().load();
    }

    protected createComboboxConfig(builder: RichComboBoxBuilder<Project>): ComboBoxConfig<Project> {
        const config: ComboBoxConfig<Project> = super.createComboboxConfig(builder);
        config.treegridDropdownAllowed = true;

        return config;
    }
}

class ProjectSelectedOptionView
    extends ProjectViewer
    implements SelectedOptionView<Project> {

    private option: Option<Project>;

    constructor(option: Option<Project>) {
        super('selected-option');
        this.setOption(option);
        this.appendRemoveButton();
    }

    setOption(option: Option<Project>) {
        this.option = option;
        this.setObject(option.displayValue);
    }

    getOption(): Option<Project> {
        return this.option;
    }
}

export class ProjectSelectedOptionsView
    extends BaseSelectedOptionsView<Project> {

    createSelectedOption(option: Option<Project>): SelectedOption<Project> {
        const optionView: ProjectSelectedOptionView = new ProjectSelectedOptionView(option);
        return new SelectedOption<Project>(optionView, this.count());
    }
}

export class ProjectsDropdownBuilder extends RichComboBoxBuilder<Project> {

    comboBoxName: string = 'projectSelector';

    optionDisplayValueViewer: ProjectViewer =  new ProjectViewer();

    optionDataHelper: ProjectOptionDataHelper = new ProjectOptionDataHelper();

    loader: ProjectOptionDataLoader = new ProjectOptionDataLoader();

    selectedOptionsView: ProjectSelectedOptionsView = new ProjectSelectedOptionsView();

    maximumOccurrences: number = 1;
}
