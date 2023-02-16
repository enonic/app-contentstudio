import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {WidgetItemView} from '../../WidgetItemView';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {DlEl} from '@enonic/lib-admin-ui/dom/DlEl';
import {DdDtEl} from '@enonic/lib-admin-ui/dom/DdDtEl';
import {GetApplicationRequest} from '../../../../resource/GetApplicationRequest';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {EditDetailsDialog} from './EditDetailsDialog';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';

export class PropertiesWidgetItemView
    extends WidgetItemView {

    protected item: ContentSummaryAndCompareStatus;
    protected list: DlEl;
    protected editPropertiesLink?: AEl;
    protected allowedForms: PropertiesWizardStepForm[];
    protected helper: PropertiesWidgetItemViewHelper;
    protected detailsDialog?: EditDetailsDialog;

    public static debug: boolean = false;

    constructor() {
        super('properties-widget-item-view');

        this.helper = new PropertiesWidgetItemViewHelper();
        this.list = new DlEl();
        this.appendChild(this.list);
        this.initListeners();
    }

    private initListeners(): void {
        ContentServerEventsHandler.getInstance().onContentPublished(this.handleContentPublished.bind(this));
    }

    private handleContentPublished(contents: ContentSummaryAndCompareStatus[]): void {
        if (!this.item) {
            return;
        }

        const thisContentId: string = this.item.getId();

        const contentSummary: ContentSummaryAndCompareStatus =
            contents.filter((content: ContentSummaryAndCompareStatus) => thisContentId === content.getId())[0];

        if (contentSummary) {
            this.setContentAndUpdateView(contentSummary);
        }
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        if (!item.getContentSummary().equals(this.item?.getContentSummary())) {
            this.item = item;
            this.helper.setItem(item);

            return this.layout();
        }

        return Q<any>(null);
    }

    public layout(): Q.Promise<any> {
        if (PropertiesWidgetItemView.debug) {
            console.debug('PropertiesWidgetItemView.layout');
        }

        this.allowedForms = [];

        return super.layout().then(() => {
            if (this.item != null) {
                this.layoutContent();
            }
        });
    }

    private layoutContent(): void {
        const applicationKey: ApplicationKey = this.item.getType().getApplicationKey();

        if (!applicationKey.isSystemReserved()) {
            new GetApplicationRequest(applicationKey).sendAndParse().then((application: Application) => {
                this.layoutApplication(application);
            }).catch(() => {
                this.layoutApplication();
            });
        } else {
            this.layoutApplication();
        }
    }

    protected layoutApplication(application?: Application): void {
        this.layoutProperties(application);
        this.layoutEditLink();
    }

    private layoutProperties(application: Application): void {
        this.list.removeChildren();

        this.helper.generateProps(application).forEach((value: string, key: string) => {
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

    private layoutEditLink(): void {
        this.helper.getAllowedForms().then((forms: PropertiesWizardStepForm[]) => {
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
        this.editPropertiesLink.setHtml(i18n('widget.properties.edit.text'));

        this.editPropertiesLink.onClicked((event: MouseEvent) => {
            if (!this.detailsDialog) {
                this.detailsDialog = new EditDetailsDialog();
            }

            this.detailsDialog.setFormsAllowed(this.allowedForms).setItem(this.item.getContentSummary()).open();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.appendChild(new DivEl('edit-settings-link-container').appendChild(this.editPropertiesLink));
    }
}
