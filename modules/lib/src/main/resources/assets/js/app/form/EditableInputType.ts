import {BaseInputType} from 'lib-admin-ui/form/inputtype/support/BaseInputType';
import {IContentEdit} from './IContentEdit';
import {ContentSummary} from '../content/ContentSummary';

export abstract class EditableInputType
    extends BaseInputType
    implements IContentEdit {

    private editContentRequestListeners: { (content: ContentSummary): void }[] = [];

    onEditContentRequest(listener: (content: ContentSummary) => void) {
        this.editContentRequestListeners.push(listener);
    }

    unEditContentRequest(listener: (content: ContentSummary) => void) {
        this.editContentRequestListeners = this.editContentRequestListeners
            .filter(function (curr: (content: ContentSummary) => void) {
                return curr !== listener;
            });
    }

    notifyEditContentRequested(content: ContentSummary) {
        this.editContentRequestListeners.forEach((listener) => {
            listener(content);
        });
    }
}
