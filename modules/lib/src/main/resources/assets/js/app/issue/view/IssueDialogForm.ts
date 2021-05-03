import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {PrincipalComboBox} from 'lib-admin-ui/ui/security/PrincipalComboBox';
import {TextArea} from 'lib-admin-ui/ui/text/TextArea';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {RichComboBox} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {Issue} from '../Issue';
import {ContentComboBox} from '../../inputtype/ui/selector/ContentComboBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {FormView} from 'lib-admin-ui/form/FormView';
import {ContentSummary} from '../../content/ContentSummary';

export class IssueDialogForm
    extends Form {

    private approversSelector: PrincipalComboBox;

    private description: TextArea;

    private contentItemsSelector: RichComboBox<any>;

    private title: TextInput;

    private contentItemsAddedListeners: { (items: ContentTreeSelectorItem[]): void }[] = [];

    private contentItemsRemovedListeners: { (items: ContentTreeSelectorItem[]): void }[] = [];
    private addItemsButtonItem: Button;
    private contentItemsFormItem: FormItem;
    private contentItemsSelectorLocked: boolean;

    constructor() {

        super('issue-dialog-form');

        this.initElements();
        this.initFormView();
    }

    public doRender(): Q.Promise<boolean> {
        return super.doRender().then(() => {
            return this.approversSelector.getLoader().load().then(() => {
                this.title.giveFocus();
                return true;
            });
        });
    }

    show() {
        super.show();
        this.displayValidationErrors(false);
    }

    private initElements() {

        this.title = new TextInput('title');

        this.description = new TextArea('description');
        this.description.addClass('description');

        const principalLoader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER]).skipPrincipals(
            [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()]);

        this.approversSelector = <PrincipalComboBox>PrincipalComboBox.create().setLoader(principalLoader).setMaximumOccurrences(0).build();

        this.contentItemsSelector = ContentComboBox.create().build();

        this.contentItemsSelector.onOptionSelected((option) => {
            this.notifyContentItemsAdded(
                [<ContentTreeSelectorItem>option.getSelectedOption().getOption().getDisplayValue()]);
        });

        this.contentItemsSelector.onOptionDeselected((option) => {
            this.notifyContentItemsRemoved(
                [<ContentTreeSelectorItem>option.getSelectedOption().getOption().getDisplayValue()]);
        });
    }

    private initFormView() {

        const fieldSet: Fieldset = new Fieldset();

        const titleFormItem = new FormItemBuilder(this.title).setLabel(i18n('field.title')).setValidator(Validators.required).build();
        fieldSet.add(titleFormItem);

        const descriptionFormItem = new FormItemBuilder(this.description).setLabel(i18n('field.description')).build();
        fieldSet.add(descriptionFormItem);

        const selectorFormItem = new FormItemBuilder(this.approversSelector).setLabel(i18n('field.assignees')).build();
        selectorFormItem.addClass('issue-approver-selector');
        fieldSet.add(selectorFormItem);

        this.contentItemsFormItem = new FormItemBuilder(this.contentItemsSelector).setLabel(i18n('field.items')).build();
        fieldSet.add(this.contentItemsFormItem);

        this.addItemsButtonItem = new Button(i18n('dialog.issue.addItems'));
        this.addItemsButtonItem.onClicked((e: MouseEvent) => {
            this.contentItemsFormItem.show();
            this.addItemsButtonItem.hide();
        });

        this.title.onValueChanged(() => {
            this.validate(true);
        });

        this.approversSelector.onValueChanged(() => {
            this.validate(true);
        });

        this.add(fieldSet);
        this.appendChild(this.addItemsButtonItem);
    }

    private toggleContentItemsSelector(value: boolean) {
        if (!this.contentItemsSelectorLocked) {
            this.contentItemsFormItem.setVisible(value);
            this.addItemsButtonItem.setVisible(!value);
        }
    }

    public setReadOnly(readOnly: boolean) {
        this.title.setEnabled(!readOnly);
        this.description.setEnabled(!readOnly);
        this.approversSelector.setEnabled(!readOnly);

        const titleFormItem = <FormItem>this.title.getParentElement();
        titleFormItem.setVisible(!readOnly);

        const descFormItem = <FormItem>this.description.getParentElement();
        descFormItem.setVisible(!readOnly);

        const selectorFormItem = <FormItem>this.approversSelector.getParentElement();
        selectorFormItem.setLabel(readOnly ? i18n('field.assignees') + ':' : i18n('dialog.issue.inviteUsers'));

        this.contentItemsFormItem.setVisible(!readOnly);
        this.addItemsButtonItem.setVisible(!readOnly);
    }

    lockContentItemsSelector(lock: boolean) {
        this.contentItemsSelectorLocked = lock;
        if (lock) {
            this.contentItemsFormItem.hide();
            this.addItemsButtonItem.hide();
        } else {
            this.toggleContentItemsSelector(this.contentItemsSelector.getSelectedValues().length > 0);
        }
    }

    public setIssue(issue: Issue) {
        this.doSetIssue(issue);
    }

    private doSetIssue(issue: Issue) {

        this.title.setValue(issue.getTitle());
        this.description.setValue(issue.getDescription());

        this.whenRendered(() => this.setApprovers(issue.getApprovers()));
    }

    public displayValidationErrors(value: boolean) {
        if (value) {
            this.addClass(FormView.VALIDATION_CLASS);
        } else {
            this.removeClass(FormView.VALIDATION_CLASS);
        }
    }

    public getTitle(): string {
        return this.title.getValue().trim();
    }

    public getDescription(): string {
        return this.description.getValue().trim();
    }

    public getApprovers(): PrincipalKey[] {
        return this.approversSelector.getSelectedValues().map(value => PrincipalKey.fromString(value));
    }

    public giveFocus(): boolean {
        if (this.title) {
            return this.title.giveFocus();
        }
        return false;
    }

    public reset() {
        this.title.setValue('');
        this.description.setValue('');
        this.approversSelector.clearCombobox();
        this.approversSelector.setValue('');

        this.contentItemsSelector.clearCombobox();
        this.contentItemsSelector.clearSelection();
        this.lockContentItemsSelector(false);
    }

    public setContentItems(ids: ContentId[], silent: boolean = false) {
        this.toggleContentItemsSelector(ids && ids.length > 0);
        this.contentItemsSelector.clearSelection();
        ids.forEach((id) => {
            this.contentItemsSelector.selectOptionByValue(id.toString(), silent);
        });
    }

    public selectContentItems(contents: ContentSummary[], silent: boolean = false) {
        if (!contents) {
            return;
        }
        this.toggleContentItemsSelector(contents && contents.length > 0);
        contents.forEach((value) => {
            this.contentItemsSelector.select(value, false, silent);
        });
    }

    public deselectContentItems(contents: ContentSummary[], silent: boolean = false) {
        if (!contents) {
            return;
        }
        contents.forEach((value) => {
            this.contentItemsSelector.deselect(value, silent);
        });
        this.toggleContentItemsSelector(this.contentItemsSelector.getSelectedValues().length > 0);
    }

    private setApprovers(approvers: PrincipalKey[]) {

        if (approvers) {
            this.approversSelector.setValue(approvers.map(key => key.toString()).join(';'));
        }
    }

    onContentItemsAdded(listener: (items: ContentTreeSelectorItem[]) => void) {
        this.contentItemsAddedListeners.push(listener);
    }

    unContentItemsAdded(listener: (items: ContentTreeSelectorItem[]) => void) {
        this.contentItemsAddedListeners = this.contentItemsAddedListeners.filter((current) => {
            return listener !== current;
        });
    }

    private notifyContentItemsAdded(items: ContentTreeSelectorItem[]) {
        this.contentItemsAddedListeners.forEach((listener) => {
            listener(items);
        });
    }

    onContentItemsRemoved(listener: (items: ContentTreeSelectorItem[]) => void) {
        this.contentItemsRemovedListeners.push(listener);
    }

    unContentItemsRemoved(listener: (items: ContentTreeSelectorItem[]) => void) {
        this.contentItemsRemovedListeners = this.contentItemsRemovedListeners.filter((current) => {
            return listener !== current;
        });
    }

    private notifyContentItemsRemoved(items: ContentTreeSelectorItem[]) {
        this.contentItemsRemovedListeners.forEach((listener) => {
            listener(items);
        });
    }
}
