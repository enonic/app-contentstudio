import {Content, ContentBuilder} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import UploaderElConfig = api.ui.uploader.UploaderElConfig;

export class ThumbnailUploaderEl
    extends api.ui.uploader.UploaderEl<Content> {

    private iconUrlResolver: api.content.util.ContentIconUrlResolver;

    constructor(config?: UploaderElConfig) {

        if (config.url == null) {
            config.url = api.util.UriHelper.getRestUri('content/updateThumbnail');
        }
        if (config.showCancel == null) {
            config.showCancel = false;
        }
        if (config.resultAlwaysVisisble == null) {
            config.resultAlwaysVisisble = true;
        }
        if (config.allowExtensions == null) {
            config.allowExtensions = [
                {title: 'Image files', extensions: 'jpg,gif,png,svg'}
            ];
        }
        if (config.allowMultiSelection == null) {
            config.allowMultiSelection = false;
        }
        if (config.hasUploadButton == null) {
            config.hasUploadButton = false;
        }
        if (config.hideDefaultDropZone == null) {
            config.hideDefaultDropZone = false;
        }

        super(config);

        this.addClass('thumbnail-uploader-el');
        this.iconUrlResolver = new api.content.util.ContentIconUrlResolver();
    }

    createModel(serverResponse: ContentJson): Content {
        if (serverResponse) {
            return new ContentBuilder().fromContentJson(<ContentJson> serverResponse).build();
        } else {
            return null;
        }
    }

    getModelValue(item: Content): string {
        return this.iconUrlResolver.setContent(item).resolve();
    }

    createResultItem(value: string): api.dom.Element {
        return new api.dom.ImgEl(value);
    }

}
