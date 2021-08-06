import {Element} from 'lib-admin-ui/dom/Element';
import {Content, ContentBuilder} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {UploaderEl, UploaderElConfig} from 'lib-admin-ui/ui/uploader/UploaderEl';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {UrlHelper} from '../util/UrlHelper';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';

export class ThumbnailUploaderEl
    extends UploaderEl<Content> {

    private iconUrlResolver: ContentIconUrlResolver;

    constructor(config?: UploaderElConfig) {

        if (config.url == null) {
            config.url = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath()}/content/updateThumbnail`);
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
        this.iconUrlResolver = new ContentIconUrlResolver();
    }

    createModel(serverResponse: ContentJson): Content {
        if (serverResponse) {
            return new ContentBuilder().fromContentJson(serverResponse).build();
        } else {
            return null;
        }
    }

    getModelValue(item: Content): string {
        return this.iconUrlResolver.setContent(item).resolve();
    }

    createResultItem(value: string): Element {
        return new ImgEl(value);
    }

}
