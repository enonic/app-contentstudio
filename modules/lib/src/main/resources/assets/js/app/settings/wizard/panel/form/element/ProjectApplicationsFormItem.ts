import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {SiteConfiguratorComboBox} from '../../../../../inputtype/siteconfigurator/SiteConfiguratorComboBox';
import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ContentFormContext} from '../../../../../ContentFormContext';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ProjectApplicationsCombobox} from './ProjectApplicationsCombobox';

export class ProjectApplicationsFormItem
    extends ProjectFormItem {

    constructor() {
        super(new ProjectFormItemBuilder(new ProjectApplicationsCombobox()));

        this.addClass('project-applications-form-item');
    }

}

