import {ContentSummary} from '../content/ContentSummary';
import {FormItemView} from 'lib-admin-ui/form/FormItemView';
import {IContentEdit} from './IContentEdit';

export class EditableFormItemView
    extends FormItemView
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
