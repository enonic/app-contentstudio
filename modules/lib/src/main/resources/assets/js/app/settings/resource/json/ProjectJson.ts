import {type ProjectPermissionsJson} from './ProjectPermissionsJson';
import {type ProjectReadAccessJson} from './ProjectReadAccessJson';
import {type AttachmentJson} from '../../../attachment/AttachmentJson';
import {type ProjectSiteConfigJson} from './ProjectSiteConfigJson';

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
