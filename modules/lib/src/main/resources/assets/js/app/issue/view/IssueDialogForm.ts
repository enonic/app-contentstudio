import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PrincipalComboBox, PrincipalComboBoxWrapper} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Issue} from '../Issue';
import {ContentSelectedOptionsView} from '../../inputtype/ui/selector/ContentComboBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {ContentTreeSelectorDropdown, ContentTreeSelectorMode} from '../../inputtype/selector/ContentTreeSelectorDropdown';
import {ContentSummaryOptionDataLoader} from '../../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentListBox} from '../../inputtype/selector/ContentListBox';
import {ContentSelectorDropdownOptions} from '../../inputtype/selector/ContentSelectorDropdown';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {CSPrincipalCombobox} from '../../security/CSPrincipalCombobox';

export class IssueDialogForm
    extends Form {

    private approversSelector: PrincipalComboBox;

    private description: TextArea;

    private contentItemsSelector: ContentTreeSelectorDropdown;

    private itemsToSelect: string[] = [];

    private title: TextInput;

    private contentItemsAddedListeners: ((items: ContentTreeSelectorItem[]) => void)[] = [];

    private contentItemsRemovedListeners: ((items: ContentTreeSelectorItem[]) => void)[] = [];
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
            this.title.giveFocus();
            return true;
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

        this.approversSelector = new CSPrincipalCombobox({
            maxSelected: 0,
            allowedTypes: [PrincipalType.USER],
            skipPrincipals: [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()],
        });

        this.contentItemsSelector = this.createContentSelector();
        this.contentItemsSelector.onSelectionChanged((selectionChange: SelectionChange<ContentTreeSelectorItem>): void => {
            if (selectionChange.selected?.length > 0) {
                this.notifyContentItemsAdded(selectionChange.selected.slice());
            }

            if (selectionChange.deselected?.length > 0) {
                this.notifyContentItemsRemoved(selectionChange.deselected.slice());
            }
        });
    }

    private createContentSelector(): ContentTreeSelectorDropdown {
        const loader = new ContentSummaryOptionDataLoader<ContentTreeSelectorItem>();
        const listBox = new ContentListBox({loader: loader});
        const dropdownOptions: ContentSelectorDropdownOptions = {
            loader: loader,
            selectedOptionsView: new ContentSelectedOptionsView(),
            maxSelected: 0,
            className: 'multiple-occurrence',
            getSelectedItems: this.getItemsToSelect.bind(this),
        };

        return new ContentTreeSelectorDropdown(listBox, dropdownOptions);
    }

    private getItemsToSelect(): string[] {
        return this.itemsToSelect;
    }

    private initFormView() {

        const fieldSet: Fieldset = new Fieldset();

        const titleFormItem = new FormItemBuilder(this.title).setLabel(i18n('field.title')).setValidator(Validators.required).build();
        fieldSet.add(titleFormItem);

        const descriptionFormItem = new FormItemBuilder(this.description).setLabel(i18n('field.description')).build();
        fieldSet.add(descriptionFormItem);

        const selectorFormItem =
            new FormItemBuilder(new PrincipalComboBoxWrapper(this.approversSelector)).setLabel(i18n('field.assignees')).build();
        selectorFormItem.addClass('issue-approver-selector');
        fieldSet.add(selectorFormItem);

        const selectorWrapper = new ContentSelectorFormInputWrapper(this.contentItemsSelector);
        this.contentItemsFormItem = new FormItemBuilder(selectorWrapper).setLabel(i18n('field.items')).build();
        fieldSet.add(this.contentItemsFormItem);

        this.addItemsButtonItem = new Button(i18n('dialog.issue.addItems'));
        this.addItemsButtonItem.onClicked((e: MouseEvent) => {
            this.contentItemsFormItem.show();
            this.addItemsButtonItem.hide();
        });

        this.title.onValueChanged(() => {
            this.validate(true);
        });

        this.approversSelector.onSelectionChanged(() => {
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

        const titleFormItem = this.title.getParentElement() as FormItem;
        titleFormItem.setVisible(!readOnly);

        const descFormItem = this.description.getParentElement() as FormItem;
        descFormItem.setVisible(!readOnly);

        const selectorFormItem = this.approversSelector.getParentElement() as FormItem;
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
            this.toggleContentItemsSelector(this.contentItemsSelector.getSelectedOptions().length > 0);
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
        return this.approversSelector.getSelectedOptions().map(value => value.getOption().getDisplayValue().getKey());
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
        this.approversSelector.setSelectedItems([]);

        this.contentItemsSelector.clear();
        this.contentItemsSelector.deselectAll();

        if (this.contentItemsSelector.isInTreeMode()) {
            this.contentItemsSelector.setMode(ContentTreeSelectorMode.FLAT);
        }

        this.contentItemsSelector.setLoadWhenListShown();

        this.lockContentItemsSelector(false);
    }

    public setContentItems(ids: ContentId[], silent: boolean = false) {
        this.itemsToSelect = ids.map(id => id.toString());
        this.toggleContentItemsSelector(ids && ids.length > 0);

        ids.forEach((id) => {
            const item = this.contentItemsSelector.getItemById(id.toString());

            if (item) { // select items that were loaded in the list
                this.contentItemsSelector.select(item, silent);
            }
        });
    }

    public selectContentItems(contents: ContentSummary[], silent: boolean = false) {
        if (!contents) {
            return;
        }
        this.toggleContentItemsSelector(contents && contents.length > 0);
        contents.forEach((value) =>
            this.contentItemsSelector.select(new ContentTreeSelectorItem(value), silent)
        );
    }

    public deselectContentItems(contents: ContentSummary[], silent: boolean = false) {
        if (!contents) {
            return;
        }
        contents.forEach((value) =>
            this.contentItemsSelector.deselect(new ContentTreeSelectorItem(value), silent)
        );
        this.toggleContentItemsSelector(this.contentItemsSelector.getSelectedOptions().length > 0);
    }

    private setApprovers(approvers: PrincipalKey[]) {
        if (approvers) {
            this.approversSelector.setSelectedItems(approvers);
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

class ContentSelectorFormInputWrapper
    extends FormInputEl {

    private contentSelector: ContentTreeSelectorDropdown;

    constructor(contentSelector: ContentTreeSelectorDropdown) {
        super('div', 'content-selector-wrapper');

        this.contentSelector = contentSelector;
        this.appendChild(contentSelector);
    }


    getValue(): string {
        return this.contentSelector.getSelectedOptions()[0]?.getOption().getDisplayValue()?.getContent()?.getId() || '';
    }
}
