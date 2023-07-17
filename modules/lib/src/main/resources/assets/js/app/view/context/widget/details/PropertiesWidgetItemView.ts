import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DlEl} from '@enonic/lib-admin-ui/dom/DlEl';
import {DdDtEl} from '@enonic/lib-admin-ui/dom/DdDtEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {EditPropertiesDialog, EditPropertiesDialogParams} from './EditPropertiesDialog';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';

export abstract class PropertiesWidgetItemView
    extends WidgetItemView {

    protected item: ContentSummaryAndCompareStatus;
    protected list: DlEl;
    protected editPropertiesLink?: AEl;
    protected allowedForms: PropertiesWizardStepForm[];
    protected helper: PropertiesWidgetItemViewHelper;
    protected detailsDialog?: EditPropertiesDialog;

    public static debug: boolean = false;

    constructor(className?: string) {
        super('properties-widget-item-view ' + (className || ''));

        this.helper = this.createHelper();
        this.list = new DlEl();
        this.appendChild(this.list);
        this.initListeners();
    }

    protected abstract createHelper(): PropertiesWidgetItemViewHelper;

    protected initListeners(): void {
        //
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null> {
        if (!item.getContentSummary().equals(this.item?.getContentSummary())) {
            this.item = item;
            this.helper.setItem(item);

            if (this.isAllowedToBeShown()) {
                this.show();
                return this.layout();
            }

            this.hide();
            return Q.resolve();
        }

        return Q.resolve();
    }

    protected isAllowedToBeShown(): boolean {
        return true;
    }

    public layout(): Q.Promise<any> {
        if (PropertiesWidgetItemView.debug) {
            console.debug('PropertiesWidgetItemView.layout');
        }

        this.allowedForms = [];

        return super.layout().then(() => {
            if (this.item != null) {
                return this.fetchExtraData().then(() => {
                    this.layoutProperties();
                    this.layoutEditLink();
                    return Q.resolve();
                });
            }

            return Q.resolve();
        });
    }

    protected fetchExtraData(): Q.Promise<void> {
        return Q.resolve();
    }

    protected layoutProperties(): void {
        this.list.removeChildren();

        this.helper.generateProps().forEach((value: string, key: string) => {
            this.appendKeyValue(key, value);
        });
    }

    protected appendKeyValue(key: string, value: string) {
        this.list.appendChildren(this.createKeyEl(key), this.createValueEl(value));
    }

    protected createKeyEl(key: string): Element {
        return new DdDtEl('dd').setHtml(key);
    }

    protected createValueEl(value: string): Element {
        return new DdDtEl('dt').setHtml(value);
    }

    protected insertKeyValue(key: string, value: string, index: number) {
        const keyEl: Element = this.createKeyEl(key);
        const valueEl: Element = this.createValueEl(value);

        this.list.insertChild(valueEl, index);
        this.list.insertChild(keyEl, index);
    }

    protected layoutEditLink(): void {
        this.helper.getAllowedForms(this.getFormsTypesToEdit()).then((forms: PropertiesWizardStepForm[]) => {
            this.allowedForms = forms;
            this.doLayoutEditLink();
        }).catch((e: unknown) => {
            this.editPropertiesLink?.getParentElement().remove();
            DefaultErrorHandler.handle(e);
        });
    }

    private doLayoutEditLink(): void {
        if (this.allowedForms?.length > 0) {
            if (!this.editPropertiesLink) {
                this.initEditPropertiesLink();
            } else {
                this.appendChild(this.editPropertiesLink?.getParentElement());
            }

            // set params for dialog
        } else {
            this.editPropertiesLink?.getParentElement().remove();
        }
    }

    private initEditPropertiesLink(): void {
        this.editPropertiesLink = new AEl('edit-settings-link');
        this.editPropertiesLink.setHtml(this.getEditLinkText());

        this.editPropertiesLink.onClicked((event: MouseEvent) => {
            if (!this.detailsDialog) {
                this.detailsDialog = new EditPropertiesDialog(this.createEditPropertiesDialogParams());
            }

            this.detailsDialog.setFormsAllowed(this.allowedForms).setItem(this.item.getContentSummary()).open();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.appendChild(new DivEl('edit-settings-link-container').appendChild(this.editPropertiesLink));
    }

    protected abstract getEditLinkText(): string;

    protected abstract createEditPropertiesDialogParams(): EditPropertiesDialogParams;

    protected abstract getFormsTypesToEdit(): PropertiesWizardStepFormType[];
}
