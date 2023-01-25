import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ProjectApplicationSelectedOptionView, ProjectApplicationSelectedOptionViewBuilder} from './ProjectApplicationSelectedOptionView';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';

export class ProjectApplicationsSelectedOptionsView
    extends BaseSelectedOptionsView<Application> {

    private readonly params?: ProjectApplicationsFormParams;

    constructor(params?: ProjectApplicationsFormParams) {
        super('project-application-selected-options-view');

        this.params = params;
        this.setEditable(false);
    }


    createSelectedOption(option: Option<Application>): SelectedOption<Application> {
        const builder: ProjectApplicationSelectedOptionViewBuilder = new ProjectApplicationSelectedOptionViewBuilder()
            .setProject(this.params?.getProject())
            .setOption(option)
            .setEditable(this.params?.isConfigEditable() && option.getDisplayValue().getForm()?.getFormItems().length > 0)
            .setRemovable(true) as ProjectApplicationSelectedOptionViewBuilder;

        return new SelectedOption<Application>(new ProjectApplicationSelectedOptionView(builder), this.count());
    }
}
