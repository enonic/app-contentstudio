import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ProjectApplicationSelectedOptionView} from './ProjectApplicationSelectedOptionView';
import {BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {Application} from '@enonic/lib-admin-ui/application/Application';

export class ProjectApplicationsSelectedOptionsView
    extends BaseSelectedOptionsView<Application> {

    constructor() {
        super('project-application-selected-options-view');

        this.setEditable(false);
    }

    createSelectedOption(option: Option<Application>): SelectedOption<Application> {
        const builder: BaseSelectedOptionViewBuilder<Application> = new BaseSelectedOptionViewBuilder<Application>()
            .setOption(option)
            .setEditable(option.getDisplayValue().getForm()?.getFormItems().length > 0)
            .setRemovable(true);

        return new SelectedOption<Application>(new ProjectApplicationSelectedOptionView(builder), this.count());
    }
}
