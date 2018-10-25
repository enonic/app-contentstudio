import InputEl = api.dom.InputEl;
import UploadStartedEvent = api.ui.uploader.UploadStartedEvent;
import UploadItem = api.ui.uploader.UploadItem;
import UploadProgressEvent = api.ui.uploader.UploadProgressEvent;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import UploadCompleteEvent = api.ui.uploader.UploadCompleteEvent;
import UploadFailedEvent = api.ui.uploader.UploadFailedEvent;
import {MediaUploaderEl, MediaUploaderElOperation} from '../inputtype/ui/upload/MediaUploaderEl';
import {Content} from '../content/Content';

export class FileInput
    extends api.dom.CompositeFormInputEl {

    private textInput: InputEl;
    private mediaUploaderEl: MediaUploaderEl;

    constructor(className?: string, originalValue?: string) {
        super();

        this.setWrappedInput(this.textInput = new InputEl('text'));
        this.setAdditionalElements(this.mediaUploaderEl = this.createMediaUploaderEl(originalValue));

        this.addClass('file-input' + (className ? ' ' + className : ''));
    }

    private createMediaUploaderEl(originalValue?: string): MediaUploaderEl {

        let mediaUploaderEl = new MediaUploaderEl({
            operation: MediaUploaderElOperation.create,
            name: 'file-input-uploader',
            allowDrop: true,
            showResult: false,
            showCancel: false,
            allowMultiSelection: true,
            deferred: false,  // wait till it's shown
            value: originalValue
        });

        mediaUploaderEl.onUploadStarted((event: UploadStartedEvent<Content>) => {
            let names = event.getUploadItems().map((uploadItem: UploadItem<Content>) => {
                return uploadItem.getName();
            });
            this.textInput.setValue(names.join(', '));
        });

        return mediaUploaderEl;
    }

    setUploaderParams(params: { [key: string]: any }): FileInput {
        this.mediaUploaderEl.setParams(params);
        return this;
    }

    getUploaderParams(): { [key: string]: string } {
        return this.mediaUploaderEl.getParams();
    }

    setPlaceholder(placeholder: string): FileInput {
        this.textInput.setPlaceholder(placeholder);
        return this;
    }

    getPlaceholder(): string {
        return this.textInput.getPlaceholder();
    }

    reset(): FileInput {
        this.textInput.reset();
        this.mediaUploaderEl.reset();
        return this;
    }

    stop(): FileInput {
        this.mediaUploaderEl.stop();
        return this;
    }

    enable() {
        this.textInput.getEl().setDisabled(false);
        this.mediaUploaderEl.getDropzone().getEl().removeAttribute('disabled');
        this.mediaUploaderEl.getEl().removeAttribute('disabled');
    }

    disable() {
        this.textInput.getEl().setDisabled(true);
        this.mediaUploaderEl.getDropzone().getEl().setAttribute('disabled', 'true');
        this.mediaUploaderEl.getEl().setAttribute('disabled', 'true');
    }

    getUploader(): MediaUploaderEl {
        return this.mediaUploaderEl;
    }

    onUploadStarted(listener: (event: UploadStartedEvent<Content>) => void) {
        this.mediaUploaderEl.onUploadStarted(listener);
    }

    unUploadStarted(listener: (event: UploadStartedEvent<Content>) => void) {
        this.mediaUploaderEl.unUploadStarted(listener);
    }

    onUploadProgress(listener: (event: UploadProgressEvent<Content>) => void) {
        this.mediaUploaderEl.onUploadProgress(listener);
    }

    unUploadProgress(listener: (event: UploadProgressEvent<Content>) => void) {
        this.mediaUploaderEl.unUploadProgress(listener);
    }

    onFileUploaded(listener: (event: UploadedEvent<Content>) => void) {
        this.mediaUploaderEl.onFileUploaded(listener);
    }

    unFileUploaded(listener: (event: UploadedEvent<Content>) => void) {
        this.mediaUploaderEl.unFileUploaded(listener);
    }

    onUploadCompleted(listener: (event: UploadCompleteEvent<Content>) => void) {
        this.mediaUploaderEl.onUploadCompleted(listener);
    }

    unUploadCompleted(listener: (event: UploadCompleteEvent<Content>) => void) {
        this.mediaUploaderEl.unUploadCompleted(listener);
    }

    onUploadReset(listener: () => void) {
        this.mediaUploaderEl.onUploadReset(listener);
    }

    unUploadReset(listener: () => void) {
        this.mediaUploaderEl.unUploadReset(listener);
    }

    onUploadFailed(listener: (event: UploadFailedEvent<Content>) => void) {
        this.mediaUploaderEl.onUploadFailed(listener);
    }

    unUploadFailed(listener: (event: UploadFailedEvent<Content>) => void) {
        this.mediaUploaderEl.unUploadFailed(listener);
    }

}
