import {ProjectPermissionsJson} from './ProjectPermissionsJson';

export interface ProjectJson {
    name: string;

    displayName: string;

    description: string;

    icon: string;

    permissions: ProjectPermissionsJson;
}
