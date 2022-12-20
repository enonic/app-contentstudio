import {ContentWizardStepForm} from './ContentWizardStepForm';
import {SettingsWizardStepForm} from './SettingsWizardStepForm';
import {ScheduleWizardStepForm} from './ScheduleWizardStepForm';
import {XDataWizardStepForms} from './XDataWizardStepForms';
import * as Q from 'q';
import {XData} from '../content/XData';
import {GetContentXDataRequest} from '../resource/GetContentXDataRequest';
import {ContentId} from '../content/ContentId';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {Content, ContentBuilder} from '../content/Content';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentFormContext} from '../ContentFormContext';
import {ExtraData} from '../content/ExtraData';
import {XDataName} from '../content/XDataName';

export class ShadowForms {

    private readonly contentType: ContentType;

    private readonly formContext: ContentFormContext;

    private contentWizardStepForm: ContentWizardStepForm;

    private settingsWizardStepForm: SettingsWizardStepForm;

    private scheduleWizardStepForm: ScheduleWizardStepForm;

    private xDataWizardStepForms: XDataWizardStepForms;

    constructor(contentType: ContentType, formContext: ContentFormContext) {
        this.contentType = contentType;
        this.formContext = formContext;

        this.contentWizardStepForm = new ContentWizardStepForm();
        this.settingsWizardStepForm = new SettingsWizardStepForm();
        this.scheduleWizardStepForm = new ScheduleWizardStepForm();
        this.xDataWizardStepForms = new XDataWizardStepForms();
    }

    private fetchContentXData(id: ContentId): Q.Promise<XData[]> {
        return new GetContentXDataRequest(id).sendAndParse();
    }

    private createXDataWizardStepForms(xDatas: XData[]): XDataWizardStepForm[] {
        const added: XDataWizardStepForm[] = [];

        xDatas.forEach((xData: XData) => {
            const stepForm: XDataWizardStepForm = new XDataWizardStepForm(xData);
            this.xDataWizardStepForms.add(stepForm);
            added.push(stepForm);
        });

        return added;
    }

    layout(content: Content): Q.Promise<void> {
        return this.fetchContentXData(content.getContentId()).then(this.createXDataWizardStepForms.bind(this)).then(() => {
            return this.layoutWizardStepForms(content);
        });
    }

    populateWithFormsData(viewedContentBuilder: ContentBuilder): void {
        viewedContentBuilder.setData(this.contentWizardStepForm.getData());

        const extraData: ExtraData[] = [];

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            extraData.push(new ExtraData(new XDataName(form.getXDataNameAsString()), form.getData()));
        });

        viewedContentBuilder.setExtraData(extraData);

        this.settingsWizardStepForm.apply(viewedContentBuilder);
        this.scheduleWizardStepForm.apply(viewedContentBuilder);
    }

    private layoutWizardStepForms(content: Content): Q.Promise<void> {
        const contentData = content.getContentData();

        const formViewLayoutPromises: Q.Promise<void>[] = [];
        formViewLayoutPromises.push(
            this.contentWizardStepForm.layout(this.formContext, contentData, this.contentType.getForm()));
        // Must pass FormView from contentWizardStepForm displayNameResolver,
        // since a new is created for each call to renderExisting
        this.settingsWizardStepForm.layout(content);
        this.scheduleWizardStepForm.layout(content);

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            formViewLayoutPromises.push(this.layoutXDataWizardStepForm(content, form));
        });

        return Q.all(formViewLayoutPromises).thenResolve(null);
    }

    private layoutXDataWizardStepForm(content: Content, xDataStepForm: XDataWizardStepForm): Q.Promise<void> {
        const extraData = content.getExtraDataByName(xDataStepForm.getXData().getXDataName());
        const data: PropertyTree = extraData ? extraData.getData() : new PropertyTree();

        const xDataForm: Form = new FormBuilder().addFormItems(xDataStepForm.getXData().getFormItems()).build();

        return xDataStepForm.layout(this.formContext, data, xDataForm);
    }
}
