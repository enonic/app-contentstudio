import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type Content, ContentBuilder} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {UploaderEl, type UploaderElConfig} from '@enonic/lib-admin-ui/ui/uploader/UploaderEl';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {UrlHelper} from '../util/UrlHelper';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';
import {ContentPath} from '../content/ContentPath';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {WorkflowStateManager, type WorkflowStateStatus} from './WorkflowStateManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ThumbnailUploaderEl
    extends UploaderEl<Content> {

    private iconUrlResolver: ContentIconUrlResolver;

    private statusBlock?: DivEl;

    constructor(config?: UploaderElConfig) {

        if (config.url == null) {
            config.url = UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(ContentPath.CONTENT_ROOT)}/content/updateThumbnail`);
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

    setStatus(status: WorkflowStateStatus): void {
        if (!this.statusBlock) {
            this.statusBlock = new DivEl('workflow-status');
            this.appendNewItems([this.statusBlock]);
        }

        this.statusBlock.setClass(`workflow-status icon-state-${status}`);

        if (WorkflowStateManager.isReady(status)) {
            this.statusBlock.setTitle(i18n('tooltip.state.ready'));
        } else if (WorkflowStateManager.isInProgress(status)) {
            this.statusBlock.setTitle(i18n('tooltip.state.in_progress'));
        } else {
            this.statusBlock.getEl().removeAttribute('title');
        }
    }

}
