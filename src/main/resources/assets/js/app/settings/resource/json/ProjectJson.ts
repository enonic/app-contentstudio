import {ProjectPermissionsJson} from './ProjectPermissionsJson';
import {ProjectReadAccessJson} from './ProjectReadAccessJson';
import {AttachmentJson} from '../../../attachment/AttachmentJson';

export interface ProjectJson {
    name: string;

    displayName: string;

    description: string;

    parent: string;

    icon: AttachmentJson;

    permissions: ProjectPermissionsJson;

    readAccess: ProjectReadAccessJson;

    language: string;
}
