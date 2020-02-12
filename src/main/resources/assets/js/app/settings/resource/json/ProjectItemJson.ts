import {SettingsItemJson} from './SettingsItemJson';
import {ProjectPermissionsJson} from './ProjectPermissionsJson';

export interface ProjectItemJson
    extends SettingsItemJson {

    name: string;

    permissions: ProjectPermissionsJson;

}
