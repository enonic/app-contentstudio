import {InputView} from 'lib-admin-ui/form/InputView';
import {ContentSummary} from '../content/ContentSummary';
import {EditableInputTypeView} from './EditableInputTypeView';
import {IContentEdit} from './IContentEdit';

export class EditableInputView
    extends InputView
    implements IContentEdit {

    private editContentRequestListeners: { (content: ContentSummary): void }[] = [];

    protected createInputTypeView(): EditableInputTypeView {
        const view = <EditableInputTypeView>super.createInputTypeView();

        view.onEditContentRequest((content: ContentSummary) => this.notifyEditContentRequested(content));

        return view;
    }

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
