import {Input} from '@enonic/lib-admin-ui/form/Input';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {ContentInputTypeViewContext} from './inputtype/ContentInputTypeViewContext';
import {Content} from './content/Content';
import {Site} from './content/Site';
import {FormContext, FormContextBuilder} from '@enonic/lib-admin-ui/form/FormContext';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from './content/ContentId';
import {ContentPath} from './content/ContentPath';
import {Project} from './settings/data/project/Project';

export class ContentFormContext
    extends FormContext {

    private site?: Site;

    private persistedContent?: Content;

    private contentTypeName?: ContentTypeName;

    private project?: Project;

    private contentUpdatedListeners: { (content: Content): void }[] = [];

    constructor(builder: ContentFormContextBuilder) {
        super(builder);

        this.site = builder.site;
        this.persistedContent = builder.persistedContent;
        this.contentTypeName = builder.contentTypeName;
        this.project = builder.project;
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

    createInputTypeViewContext(inputTypeConfig: any, parentPropertyPath: PropertyPath, input: Input): ContentInputTypeViewContext {
        const viewContext = <ContentInputTypeViewContext> {
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath,
            site: this.getSite(),
            content: this.getPersistedContent(),
            project: this.getProject()
        };

        this.contentUpdatedListeners.push(content => {
            viewContext.content = content;
        });

        return viewContext;
    }

    cloneBuilder(): ContentFormContextBuilder {
        return <ContentFormContextBuilder>ContentFormContext.create()
            .setSite(this.site)
            .setPersistedContent(this.persistedContent)
            .setContentTypeName(this.contentTypeName)
            .setProject(this.project)
            .setFormState(this.getFormState())
            .setShowEmptyFormItemSetOccurrences(this.getShowEmptyFormItemSetOccurrences())
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

    public setSite(value: Site): ContentFormContextBuilder {
        this.site = value;
        return this;
    }

    public setPersistedContent(value: Content): ContentFormContextBuilder {
        this.persistedContent = value;
        return this;
    }

    public setContentTypeName(value: ContentTypeName): ContentFormContextBuilder {
        this.contentTypeName = value;
        return this;
    }

    public setProject(value: Project): ContentFormContextBuilder {
        this.project = value;
        return this;
    }

    public build(): ContentFormContext {
        return new ContentFormContext(this);
    }
}
