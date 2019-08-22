import '../../../../../api.ts';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import {LayerIcon} from '../../../../layer/LayerIcon';

export class ContentInLayerViewer
    extends api.ui.NamesAndIconViewer<ContentInLayer> {

    constructor() {
        super();
        this.addClass('content-in-layer-viewer');
    }

    resolveDisplayName(object: ContentInLayer): string {
        const displayName = object.getDisplayName();

        const language = object.getLanguage();

        if (language) {
            const languageStr = language ? `<span>(${language})</span>` : '';
            return displayName + ' ' + languageStr;
        }

        return displayName;
    }

    resolveSubName(object: ContentInLayer, relativePath: boolean = false): string {
        return object.getPath();
    }

    resolveIconEl(object: ContentInLayer): api.dom.Element {
        return new LayerIcon(object.getLayerLanguage());
    }
}
