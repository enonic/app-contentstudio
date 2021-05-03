import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {IContentEdit} from '../form/IContentEdit';
import {ContentSummary} from '../content/ContentSummary';

export abstract class EditableInputTypeManagingAdd
    extends BaseInputTypeManagingAdd
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
