import {ProjectPermissionsJson} from './ProjectPermissionsJson';
import {ProjectReadAccessJson} from './ProjectReadAccessJson';
import {AttachmentJson} from '../../../attachment/AttachmentJson';
import {ProjectSiteConfigJson} from './ProjectSiteConfigJson';

export interface ProjectJson {
    name: string;

    displayName: string;

    description: string;

    parents: string[];

    icon: AttachmentJson;

    permissions: ProjectPermissionsJson;

    readAccess: ProjectReadAccessJson;

    language: string;

    siteConfigs: ProjectSiteConfigJson[];
}
