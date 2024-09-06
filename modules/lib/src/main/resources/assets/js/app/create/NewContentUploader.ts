import {UploadStartedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadStartedEvent';
import {MediaUploaderEl, MediaUploaderElOperation} from '../inputtype/ui/upload/MediaUploaderEl';
import {Content} from '../content/Content';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class NewContentUploader
    extends DivEl {

    private mediaUploaderEl: MediaUploaderEl;

    constructor() {
        super('new-content-uploader');

        this.initElements();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.mediaUploaderEl);

            return rendered;
        });
    }

    private initElements() {
        this.mediaUploaderEl = this.createMediaUploaderEl();
    }

    private createMediaUploaderEl(): MediaUploaderEl {

        let mediaUploaderEl = new MediaUploaderEl({
            operation: MediaUploaderElOperation.create,
            name: 'file-input-uploader',
            allowDrop: true,
            showResult: false,
            showCancel: false,
            allowMultiSelection: true,
            deferred: false,  // wait till it's shown
            value: undefined
        });

        return mediaUploaderEl;
    }

    isEnabled(): boolean {
        return this.mediaUploaderEl.isEnabled();
    }

    setDropzoneId(id: string): NewContentUploader {
        this.mediaUploaderEl.addDropzone(id);
        return this;
    }

    setUploaderParams(params: object): NewContentUploader {
        this.mediaUploaderEl.setParams(params);
        return this;
    }

    setEnabled(value: boolean) {
        this.toggleClass('disabled', !value);
        this.mediaUploaderEl.setEnabled(value);
        if (value) {
            this.enable();
        } else {
            this.disable();
        }
    }

    reset(): NewContentUploader {
        this.mediaUploaderEl.reset();
        return this;
    }

    enable() {
        this.mediaUploaderEl.getDropzone().getEl().removeAttribute('disabled');
        this.mediaUploaderEl.getEl().removeAttribute('disabled');
    }

    disable() {
        this.mediaUploaderEl.getDropzone().getEl().setAttribute('disabled', 'true');
        this.mediaUploaderEl.getEl().setAttribute('disabled', 'true');
    }

    focus() {
        this.mediaUploaderEl.getUploadButton().giveFocus();
    }

    onUploadStarted(listener: (event: UploadStartedEvent<Content>) => void) {
        this.mediaUploaderEl.onUploadStarted(listener);
    }

    unUploadStarted(listener: (event: UploadStartedEvent<Content>) => void) {
        this.mediaUploaderEl.unUploadStarted(listener);
    }

    onDropzoneDrop(listener: () => void) {
        this.mediaUploaderEl.onDropzoneDrop(listener);
    }

    unDropzoneDrop(listener: () => void) {
        this.mediaUploaderEl.unDropzoneDragDrop(listener);
    }

    onDropzoneDragLeave(listener: () => void) {
        this.mediaUploaderEl.onDropzoneDragLeave(listener);
    }

    unDropzoneDragLeave(listener: () => void) {
        this.mediaUploaderEl.unDropzoneDragLeave(listener);
    }
}
