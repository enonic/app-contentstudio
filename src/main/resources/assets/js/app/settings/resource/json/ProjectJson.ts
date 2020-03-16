import {ProjectPermissionsJson} from './ProjectPermissionsJson';
import {ProjectReadAccessJson} from './ProjectReadAccessJson';

export interface ProjectJson {
    name: string;

    displayName: string;

    description: string;

    icon: string;

    permissions: ProjectPermissionsJson;

    readAccess: ProjectReadAccessJson;
}
