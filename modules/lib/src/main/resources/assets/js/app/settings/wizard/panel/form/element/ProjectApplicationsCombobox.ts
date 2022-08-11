import {Application} from '@enonic/lib-admin-ui/application/Application';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {ProjectApplicationsLoader} from '../../../../resource/applications/ProjectApplicationsLoader';
import {ProjectApplicationsSelectedOptionsView} from './ProjectApplicationsSelectedOptionsView';
import {ProjectApplicationViewer} from './ProjectApplicationViewer';

export class ProjectApplicationsCombobox extends RichComboBox<Application> {

    constructor() {
        const builder: RichComboBoxBuilder<Application> = new RichComboBoxBuilder<Application>();
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
