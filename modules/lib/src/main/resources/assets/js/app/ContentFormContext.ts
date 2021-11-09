import {Input} from 'lib-admin-ui/form/Input';
import {PropertyPath} from 'lib-admin-ui/data/PropertyPath';
import {ContentInputTypeViewContext} from './inputtype/ContentInputTypeViewContext';
import {Content} from './content/Content';
import {Site} from './content/Site';
import {FormContext, FormContextBuilder} from 'lib-admin-ui/form/FormContext';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from './content/ContentId';
import {ContentPath} from './content/ContentPath';

export class ContentFormContext
    extends FormContext {

    private site: Site;

    private parentContent: Content;

    private persistedContent: Content;

    private contentTypeName: ContentTypeName;

    private contentUpdatedListeners: { (content: Content): void }[] = [];

    constructor(builder: ContentFormContextBuilder) {
        super(builder);

        this.site = builder.site;
        this.parentContent = builder.parentContent;
        this.persistedContent = builder.persistedContent;
        this.contentTypeName = builder.contentTypeName;
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

    getParentContentPath(): ContentPath {

        if (this.parentContent == null) {
            return ContentPath.getRoot();
        }

        return this.parentContent.getPath();
    }

    setParentContent(content: Content): ContentFormContext {
        this.parentContent = content;
        return this;
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

    createInputTypeViewContext(inputTypeConfig: any, parentPropertyPath: PropertyPath, input: Input): ContentInputTypeViewContext {
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

    cloneBuilder(): ContentFormContextBuilder {
        return <ContentFormContextBuilder>ContentFormContext.create()
            .setSite(this.site)
            .setParentContent(this.parentContent)
            .setPersistedContent(this.persistedContent)
            .setContentTypeName(this.contentTypeName)
            .setFormState(this.getFormState())
            .setShowEmptyFormItemSetOccurrences(this.getShowEmptyFormItemSetOccurrences())
            .setValidationErrors(this.getCustomValidationErrors());
    }

    static create(): ContentFormContextBuilder {
        return new ContentFormContextBuilder();
    }
}

export class ContentFormContextBuilder
    extends FormContextBuilder {

    site: Site;

    parentContent: Content;

    persistedContent: Content;

    contentTypeName: ContentTypeName;

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

    public setContentTypeName(value: ContentTypeName): ContentFormContextBuilder {
        this.contentTypeName = value;
        return this;
    }

    public build(): ContentFormContext {
        return new ContentFormContext(this);
    }
}
