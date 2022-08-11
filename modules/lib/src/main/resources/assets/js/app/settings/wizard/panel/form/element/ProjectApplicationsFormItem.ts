import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectApplicationsComboBox} from './ProjectApplicationsComboBox';

export class ProjectApplicationsFormItem
    extends ProjectFormItem {

    constructor() {
        super(new ProjectFormItemBuilder(new ProjectApplicationsComboBox()));

        this.addClass('project-applications-form-item');
    }

    getComboBox(): ProjectApplicationsComboBox {
        return <ProjectApplicationsComboBox>this.getInput();
    }
}

