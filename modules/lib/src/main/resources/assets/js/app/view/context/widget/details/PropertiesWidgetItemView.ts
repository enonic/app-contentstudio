import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {WidgetItemView} from '../../WidgetItemView';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {Application} from 'lib-admin-ui/application/Application';
import {DlEl} from 'lib-admin-ui/dom/DlEl';
import {DdDtEl} from 'lib-admin-ui/dom/DdDtEl';
import {ContentSummary} from '../../../../content/ContentSummary';
import {GetApplicationRequest} from '../../../../resource/GetApplicationRequest';

export class PropertiesWidgetItemView extends WidgetItemView {

    private content: ContentSummary;

    private list: DlEl;

    public static debug: boolean = false;

    constructor() {
        super('properties-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        let content = item.getContentSummary();
        if (!content.equals(this.content)) {
            if (!this.content) {
                this.initListeners();
            }
            this.content = content;
            return this.layout();
        }

        return Q<any>(null);
    }

    private initListeners() {

        let layoutOnPublishStateChange = (contents: ContentSummaryAndCompareStatus[]) => {
            let thisContentId = this.content.getId();

            let contentSummary: ContentSummaryAndCompareStatus = contents.filter((content) => {
                return thisContentId === content.getId();
            })[0];

            if (contentSummary) {
                this.setContentAndUpdateView(contentSummary);
            }
        };

        let serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished(layoutOnPublishStateChange);

        //Uncomment the line below if we need to redo the layout on unpublish
        //serverEvents.onContentUnpublished(layoutOnPublishStateChange);
    }

    public layout(): Q.Promise<any> {
        if (PropertiesWidgetItemView.debug) {
            console.debug('PropertiesWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.content != null) {
                let applicationKey = this.content.getType().getApplicationKey();
                if (!applicationKey.isSystemReserved()) {
                    return new GetApplicationRequest(applicationKey).sendAndParse().then((application: Application) => {
                        this.layoutApplication(application);
                    }).catch(() => {
                        this.layoutApplication();
                    });
                } else {
                    this.layoutApplication();
                }
            }
        });
    }

    private layoutApplication(application?: Application) {

        if (this.hasChild(this.list)) {
            this.removeChild(this.list);
        }
        this.list = new DlEl();

        let strings: FieldString[];

        strings = [
            new FieldString().setName(i18n('field.type')).setValue(this.content.getType().getLocalName()
                ? this.content.getType().getLocalName() : this.content.getType().toString()),

            new FieldString().setName(i18n('field.app')).setValue(
                application ? application.getDisplayName() : this.content.getType().getApplicationKey().getName()),

            this.content.getLanguage() ? new FieldString().setName(i18n('field.lang')).setValue(this.content.getLanguage()) : null,

            this.content.getOwner() ? new FieldString().setName(i18n('field.owner')).setValue(this.content.getOwner().getId()) : null,

            new FieldString().setName(i18n('field.created')).setValue(DateTimeFormatter.createHtml(this.content.getCreatedTime())),

            this.content.getModifiedTime() ? new FieldString().setName(i18n('field.modified')).setValue(
                DateTimeFormatter.createHtml(this.content.getModifiedTime())) : null,

            this.content.getPublishFirstTime() ? new FieldString().setName(i18n('field.firstPublished')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishFirstTime())) : null,

            this.content.getPublishFromTime() ? new FieldString().setName(i18n('field.publishFrom')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishFromTime())) : null,

            this.content.getPublishToTime() ? new FieldString().setName(i18n('field.publishTo')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishToTime())) : null,

            new FieldString().setName(i18n('field.id')).setValue(this.content.getId())
        ];

        strings.forEach((stringItem: FieldString) => {
            if (stringItem) {
                stringItem.layout(this.list);
            }
        });
        this.removeChildren();
        this.appendChild(this.list);
    }
}

class FieldString {

    private fieldName: string;

    private value: string;

    public setName(name: string): FieldString {
        this.fieldName = name;
        return this;
    }

    public setValue(value: string): FieldString {
        this.value = value;
        return this;
    }

    public layout(parentEl: Element) {
        let valueEl = new DdDtEl('dt').setHtml(this.value);
        let spanEl = new DdDtEl('dd').setHtml(this.fieldName + ': ');
        parentEl.appendChildren(spanEl, valueEl);
    }

}
