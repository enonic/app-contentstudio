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
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class PropertiesWidgetItemView
    extends WidgetItemView {

    protected content: ContentSummary;

    protected list: DlEl;

    public static debug: boolean = false;

    constructor() {
        super('properties-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        const content: ContentSummary = item.getContentSummary();

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
        const layoutOnPublishStateChange = (contents: ContentSummaryAndCompareStatus[]) => {
            const thisContentId: string = this.content.getId();

            const contentSummary: ContentSummaryAndCompareStatus = contents.filter((content: ContentSummaryAndCompareStatus) => {
                return thisContentId === content.getId();
            })[0];

            if (contentSummary) {
                this.setContentAndUpdateView(contentSummary);
            }
        };

        ContentServerEventsHandler.getInstance().onContentPublished(layoutOnPublishStateChange);

        //Uncomment the line below if we need to redo the layout on unpublish
        //serverEvents.onContentUnpublished(layoutOnPublishStateChange);
    }

    public layout(): Q.Promise<any> {
        if (PropertiesWidgetItemView.debug) {
            console.debug('PropertiesWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.content != null) {
                const applicationKey: ApplicationKey = this.content.getType().getApplicationKey();
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

    protected layoutApplication(application?: Application) {
        if (this.hasChild(this.list)) {
            this.removeChild(this.list);
        }

        this.list = new DlEl();

        this.generateProps().forEach((value: string, key: string) => {
            this.appendKeyValue(key, value);
        });

        this.removeChildren();
        this.appendChild(this.list);
    }

    protected createKeyEl(key: string): Element {
        return new DdDtEl('dd').setHtml(key + ': ');
    }

    protected createValueEl(value: string): Element {
        return new DdDtEl('dt').setHtml(value);
    }

    protected generateProps(application?: Application): Map<string, string> {
        const propsMap: Map<string, string> = new Map<string, string>();

        this.setPropsType(propsMap);
        this.setPropsApp(propsMap, application);
        this.setPropsLang(propsMap);
        this.setPropsOwner(propsMap);
        this.setPropsCreated(propsMap);
        this.setPropsModified(propsMap);
        this.setPropsPublishFirstTime(propsMap);
        this.setPropsPublishFromTime(propsMap);
        this.setPropsPublishToTime(propsMap);
        this.setPropsFieldId(propsMap);

        return propsMap;
    }

    protected appendKeyValue(key: string, value: string) {
        this.list.appendChildren(this.createKeyEl(key), this.createValueEl(value));
    }

    protected insertKeyValue(key: string, value: string, index: number) {
        const keyEl: Element = this.createKeyEl(key);
        const valueEl: Element = this.createValueEl(value);

        this.list.insertChild(valueEl, index);
        this.list.insertChild(keyEl, index);
    }

    private setPropsType(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.type'), this.content.getType().getLocalName()
                                         ? this.content.getType().getLocalName() : this.content.getType().toString());
    }

    private setPropsApp(propsMap: Map<string, string>, application?: Application) {
        propsMap.set(i18n('field.app'),
            application ? application.getDisplayName() : this.content.getType().getApplicationKey().getName());
    }

    private setPropsLang(propsMap: Map<string, string>) {
        if (this.content.getLanguage()) {
            propsMap.set(i18n('field.lang'), this.content.getLanguage());
        }
    }

    private setPropsOwner(propsMap: Map<string, string>) {
        if (this.content.getOwner()) {
            propsMap.set(i18n('field.owner'), this.content.getOwner().getId());
        }
    }

    private setPropsCreated(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.created'), DateTimeFormatter.createHtml(this.content.getCreatedTime()));
    }

    private setPropsModified(propsMap: Map<string, string>) {
        if (this.content.getModifiedTime()) {
            propsMap.set(i18n('field.modified'), DateTimeFormatter.createHtml(this.content.getModifiedTime()));
        }
    }

    private setPropsPublishFirstTime(propsMap: Map<string, string>) {
        if (this.content.getPublishFirstTime()) {
            propsMap.set(i18n('field.firstPublished'), DateTimeFormatter.createHtml(this.content.getPublishFirstTime()));
        }
    }

    private setPropsPublishFromTime(propsMap: Map<string, string>) {
        if (this.content.getPublishFromTime()) {
            propsMap.set(i18n('field.publishFrom'), DateTimeFormatter.createHtml(this.content.getPublishFromTime()));
        }
    }

    private setPropsPublishToTime(propsMap: Map<string, string>) {
        if (this.content.getPublishToTime()) {
            propsMap.set(i18n('field.publishTo'), DateTimeFormatter.createHtml(this.content.getPublishToTime()));
        }
    }

    private setPropsFieldId(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.id'), this.content.getId());
    }
}
