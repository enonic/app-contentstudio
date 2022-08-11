import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {ProjectApplicationsLoader} from '../../../../resource/applications/ProjectApplicationsLoader';
import {ProjectApplicationsSelectedOptionsView} from './ProjectApplicationsSelectedOptionsView';
import {ProjectApplicationViewer} from './ProjectApplicationViewer';
import {ProjectApplication} from './ProjectApplication';

export class ProjectApplicationsComboBox
    extends RichComboBox<ProjectApplication> {

    constructor() {
        const builder: RichComboBoxBuilder<ProjectApplication> = new RichComboBoxBuilder<ProjectApplication>();
        builder
            .setIdentifierMethod('getApplicationKey')
            .setComboBoxName('projectApplicationsSelector')
            .setLoader(new ProjectApplicationsLoader())
            .setSelectedOptionsView(new ProjectApplicationsSelectedOptionsView())
            .setOptionDisplayValueViewer(new ProjectApplicationViewer())
            .setDelayedInputValueChangedHandling(500)
            .setDisplayMissingSelectedOptions(true);

        super(builder);
    }

}
