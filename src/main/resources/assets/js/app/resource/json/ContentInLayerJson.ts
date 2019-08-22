import {AttachmentJson} from '../../attachment/AttachmentJson';
import {CompareContentResultJson} from './CompareContentResultJson';

export interface ContentInLayerJson {

    id: string;

    path: string;

    name: string;

    displayName: string;

    language: string;

    //TODO: remove after 'icon' field will start to work
    layerLanguage: string;

    publishFirstTime: string;

    inherited: boolean;

    layer:string;

    parentLayer: string;

    layerDisplayName: string;

    icon: AttachmentJson;

    status: CompareContentResultJson;

}
