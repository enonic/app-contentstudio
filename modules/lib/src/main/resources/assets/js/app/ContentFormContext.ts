import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {FormContext, FormContextBuilder} from '@enonic/lib-admin-ui/form/FormContext';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Content} from './content/Content';
import {ContentId} from './content/ContentId';
import {ContentPath} from './content/ContentPath';
import {Site} from './content/Site';
import {ContentInputTypeViewContext} from './inputtype/ContentInputTypeViewContext';
import {Project} from './settings/data/project/Project';

export class ContentFormContext
    extends FormContext {

    private site?: Site;

    private persistedContent?: Content;

    private readonly contentTypeName?: ContentTypeName;

    private readonly project?: Project;

    private readonly applicationKey?: ApplicationKey;

    private stoppedApplications?: Application[];

    private contentUpdatedListeners: ((content: Content) => void)[] = [];

    constructor(builder: ContentFormContextBuilder) {
        super(builder);

        this.site = builder.site;
        this.persistedContent = builder.persistedContent;
        this.contentTypeName = builder.contentTypeName;
        this.project = builder.project;
        this.applicationKey = builder.applicationKey;
    }

    getSite(): Site {
        return this.site;
    }

    setSite(site: Site): ContentFormContext {
        this.site = site;
        return this;
    }

    getContentId(): ContentId {
        return this.persistedContent != null ? this.persistedContent.getContentId() : null;
    }

    getContentPath(): ContentPath {
        return this.persistedContent != null ? this.persistedContent.getPath() : null;
    }

    getPersistedContent(): Content {
        return this.persistedContent;
    }

    setPersistedContent(content: Content): ContentFormContext {
        this.persistedContent = content;
        this.contentUpdatedListeners.forEach(listener => listener(content));
        return this;
    }

    getContentTypeName(): ContentTypeName {
        return this.contentTypeName;
    }

    getProject(): Project {
        return this.project;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    setStoppedApplications(applications: Application[]): ContentFormContext {
        this.stoppedApplications = applications;
        return this;
    }

    getStoppedApplicationByKey(appKey: ApplicationKey): Application | undefined {
        return this.stoppedApplications?.find(app => app.getApplicationKey().equals(appKey));
    }

    createInputTypeViewContext(inputTypeConfig: ContentInputTypeViewContext['inputConfig'], parentPropertyPath: PropertyPath,
                               input: Input): ContentInputTypeViewContext {
        const viewContext = {
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath,
            site: this.getSite(),
            content: this.getPersistedContent(),
            project: this.getProject(),
            applicationKey: this.applicationKey
        } satisfies ContentInputTypeViewContext;

        this.contentUpdatedListeners.push(content => {
            viewContext.content = content;
        });

        return viewContext;
    }

    cloneBuilder(): ContentFormContextBuilder {
        return ContentFormContext.create()
            .setSite(this.site)
            .setPersistedContent(this.persistedContent)
            .setContentTypeName(this.contentTypeName)
            .setProject(this.project)
            .setApplicationKey(this.applicationKey)
            .setFormState(this.getFormState())
            .setShowEmptyFormItemSetOccurrences(this.getShowEmptyFormItemSetOccurrences())
            .setName(this.getName())
            .setValidationErrors(this.getValidationErrors());
    }

    static create(): ContentFormContextBuilder {
        return new ContentFormContextBuilder();
    }
}

export class ContentFormContextBuilder
    extends FormContextBuilder {

    site: Site;

    persistedContent: Content;

    contentTypeName: ContentTypeName;

    project: Project;

    applicationKey: ApplicationKey;

    public setSite(value: Site): this {
        this.site = value;
        return this;
    }

    public setPersistedContent(value: Content): this {
        this.persistedContent = value;
        return this;
    }

    public setContentTypeName(value: ContentTypeName): this {
        this.contentTypeName = value;
        return this;
    }

    public setProject(value: Project): this {
        this.project = value;
        return this;
    }

    public setApplicationKey(value: ApplicationKey): this {
        this.applicationKey = value;
        return this;
    }

    public build(): ContentFormContext {
        return new ContentFormContext(this);
    }
}
