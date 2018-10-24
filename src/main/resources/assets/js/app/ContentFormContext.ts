import PropertyPath = api.data.PropertyPath;
import FormState = api.app.wizard.FormState;
import {ContentInputTypeViewContext} from './inputtype/ContentInputTypeViewContext';
import {Content} from './content/Content';
import {Site} from './content/Site';

export class ContentFormContext
    extends api.form.FormContext {

    private site: Site;

    private parentContent: Content;

    private persistedContent: Content;

    private contentTypeName: api.schema.content.ContentTypeName;

    private formState: FormState;

    private contentUpdatedListeners: { (content: Content): void }[] = [];

    constructor(builder: ContentFormContextBuilder) {
        super(builder);
        this.site = builder.site;
        this.parentContent = builder.parentContent;
        this.persistedContent = builder.persistedContent;
        if (builder.contentTypeName) {
            this.contentTypeName = builder.contentTypeName;
        } else if (builder.persistedContent) {
            this.contentTypeName = builder.persistedContent.getType();
        }
        this.formState = builder.formState;
    }

    getSite(): Site {
        return this.site;
    }

    getFormState(): FormState {
        return this.formState;
    }

    getContentId(): api.content.ContentId {
        return this.persistedContent != null ? this.persistedContent.getContentId() : null;
    }

    getContentPath(): api.content.ContentPath {
        return this.persistedContent != null ? this.persistedContent.getPath() : null;
    }

    getParentContentPath(): api.content.ContentPath {

        if (this.parentContent == null) {
            return api.content.ContentPath.ROOT;
        }

        return this.parentContent.getPath();
    }

    getPersistedContent(): Content {
        return this.persistedContent;
    }

    updatePersistedContent(content: Content) {
        this.persistedContent = content;
        this.contentUpdatedListeners.forEach(listener => listener(content));
    }

    getContentTypeName(): api.schema.content.ContentTypeName {
        return this.contentTypeName;
    }

    createInputTypeViewContext(inputTypeConfig: any, parentPropertyPath: PropertyPath, input: api.form.Input): ContentInputTypeViewContext {
        const viewContext = <ContentInputTypeViewContext> {
            formContext: this,
            input: input,
            inputConfig: inputTypeConfig,
            parentDataPath: parentPropertyPath,
            site: this.getSite(),
            content: this.getPersistedContent(),
            contentPath: this.getContentPath(),
            parentContentPath: this.getParentContentPath()
        };

        this.contentUpdatedListeners.push(content => {
            viewContext.content = content;
        });

        return viewContext;
    }

    static create(): ContentFormContextBuilder {
        return new ContentFormContextBuilder();
    }
}

export class ContentFormContextBuilder
    extends api.form.FormContextBuilder {

    site: Site;

    parentContent: Content;

    persistedContent: Content;

    contentTypeName: api.schema.content.ContentTypeName;

    formState: FormState;

    public setSite(value: Site): ContentFormContextBuilder {
        this.site = value;
        return this;
    }

    public setParentContent(value: Content): ContentFormContextBuilder {
        this.parentContent = value;
        return this;
    }

    public setPersistedContent(value: Content): ContentFormContextBuilder {
        this.persistedContent = value;
        return this;
    }

    public setContentTypeName(value: api.schema.content.ContentTypeName): ContentFormContextBuilder {
        this.contentTypeName = value;
        return this;
    }

    public setFormState(value: FormState): ContentFormContextBuilder {
        this.formState = value;
        return this;
    }

    public build(): ContentFormContext {
        return new ContentFormContext(this);
    }
}
