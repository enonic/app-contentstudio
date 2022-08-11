import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ProjectApplicationSelectedOptionView} from './ProjectApplicationSelectedOptionView';
import {ProjectApplication} from './ProjectApplication';
import {BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';

export class ProjectApplicationsSelectedOptionsView
    extends BaseSelectedOptionsView<ProjectApplication> {

    constructor() {
        super('project-application-selected-options-view');

        this.setEditable(false);
    }

    createSelectedOption(option: Option<ProjectApplication>): SelectedOption<ProjectApplication> {
        const builder: BaseSelectedOptionViewBuilder<ProjectApplication> = new BaseSelectedOptionViewBuilder<ProjectApplication>()
            .setOption(option)
            .setEditable(false)
            .setRemovable(true);

        return new SelectedOption<ProjectApplication>(new ProjectApplicationSelectedOptionView(builder), this.count());
    }
}
