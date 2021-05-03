import {FormView} from 'lib-admin-ui/form/FormView';
import {ContentFormEditEvent} from '../content/event/ContentFormEditEvent';
import {ContentSummary} from '../content/ContentSummary';
import {EditableFormItemView} from './EditableFormItemView';

export class EditableFormView
    extends FormView {

        protected initFormItemViewEventListeners() {
            super.initFormItemViewEventListeners();

            this.formItemViews.forEach((formItemView: EditableFormItemView) => {
                formItemView.onEditContentRequest((content: ContentSummary) => {
                    new ContentFormEditEvent(content).fire();
                });
            });
        }
    }
