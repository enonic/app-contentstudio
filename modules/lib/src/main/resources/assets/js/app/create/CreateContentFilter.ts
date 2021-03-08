import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';

let TYPES_ALLOWED_EVERYWHERE: { [key: string]: ContentTypeName } = {};
[
    ContentTypeName.UNSTRUCTURED, ContentTypeName.FOLDER, ContentTypeName.SITE,
    ContentTypeName.SHORTCUT, ContentTypeName.FRAGMENT
].forEach((contentTypeName: ContentTypeName) => {
    TYPES_ALLOWED_EVERYWHERE[contentTypeName.toString()] = contentTypeName;
});

export class CreateContentFilter {

    private siteApplicationsAllowed: { [key: string]: ApplicationKey };

    constructor() {
        this.siteApplicationsAllowed = null;
    }

    siteApplicationsFilter(siteApplicationKeys: ApplicationKey[]): CreateContentFilter {
        if (siteApplicationKeys == null) {
            return this;
        }
        this.siteApplicationsAllowed = {};
        siteApplicationKeys.forEach((applicationKey: ApplicationKey) => {
            this.siteApplicationsAllowed[applicationKey.toString()] = applicationKey;
        });
        return this;
    }

    isCreateContentAllowed(parentContent: ContentSummary, contentType: ContentTypeSummary): boolean {
        let parentContentIsTemplateFolder = parentContent && parentContent.getType().isTemplateFolder();
        let parentContentIsSite = parentContent && parentContent.getType().isSite();
        let parentContentIsPageTemplate = parentContent && parentContent.getType().isPageTemplate();

        let contentTypeName = contentType.getContentTypeName();
        if (contentType.isAbstract()) {
            return false;
        } else if (parentContentIsPageTemplate) {
            return false; // children not allowed for page-template
        } else if (contentTypeName.isTemplateFolder()) {
            return parentContentIsSite; // template-folder only allowed under site
        } else if (contentTypeName.isPageTemplate()) {
            return parentContentIsTemplateFolder; // page-template only allowed under a template-folder
        } else if (parentContentIsTemplateFolder) {
            return contentTypeName.isPageTemplate(); // in a template-folder allow only page-template
        } else if (TYPES_ALLOWED_EVERYWHERE[contentTypeName.toString()]) {
            return true;
        } else if ((!this.siteApplicationsAllowed) || this.siteApplicationsAllowed[contentTypeName.getApplicationKey().toString()]) {
            return true;
        } else {
            return false;
        }
    }

}
