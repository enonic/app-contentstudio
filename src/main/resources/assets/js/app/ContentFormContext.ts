import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {Input} from 'lib-admin-ui/form/Input';
import {PropertyPath} from 'lib-admin-ui/data/PropertyPath';
import {ContentInputTypeViewContext} from './inputtype/ContentInputTypeViewContext';
import {Content} from './content/Content';
import {Site} from './content/Site';
import {FormContext, FormContextBuilder} from 'lib-admin-ui/form/FormContext';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

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
        if (builder.contentTypeName) {
            this.contentTypeName = builder.contentTypeName;
        } else if (builder.persistedContent) {
            this.contentTypeName = builder.persistedContent.getType();
        }
    }

    getSite(): Site {
        return this.site;
    }

    getContentId(): ContentId {
        return this.persistedContent != null ? this.persistedContent.getContentId() : null;
    }

    getContentPath(): ContentPath {
        return this.persistedContent != null ? this.persistedContent.getPath() : null;
    }

    getParentContentPath(): ContentPath {

        if (this.parentContent == null) {
            return ContentPath.ROOT;
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
