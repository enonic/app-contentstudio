import {InputTypeView} from 'lib-admin-ui/form/inputtype/InputTypeView';
import {ContentSummary} from '../content/ContentSummary';

export interface EditableInputTypeView
extends InputTypeView {

    /*
     * Invoked when input wants to edit embedded content
     */
    onEditContentRequest(listener: (content: ContentSummary) => void);

    /*
     * Invoked when input wants to edit embedded content
     */
    unEditContentRequest(listener: (content: ContentSummary) => void);


}
