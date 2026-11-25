import { type ProjectPermissionsJson } from '../../../../v6/entities/project/api/ProjectPermissionsJson';
import { type ProjectReadAccessJson } from '../../../../v6/entities/project/api/ProjectReadAccessJson';
import { type AttachmentJson } from '../../../../v6/entities/content/api/AttachmentJson';
import { type ProjectSiteConfigJson } from './ProjectSiteConfigJson';

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
