import {AttachmentJson} from '../../attachment/AttachmentJson';

export interface ContentLayerJson {

    name: string;

    parentName: string;

    displayName: string;

    description: string;

    language: string;

    icon: AttachmentJson;
}
