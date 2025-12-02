import {Content} from '../../../app/content/Content';
import {ContentId} from '../../../app/content/ContentId';
import {PageTemplate} from '../../../app/content/PageTemplate';
import {Site} from '../../../app/content/Site';
import {Descriptor} from '../../../app/page/Descriptor';
import {GetPageTemplateByKeyRequest} from '../../../app/resource/GetPageTemplateByKeyRequest';
import {GetComponentDescriptorRequest} from '../../../app/resource/GetComponentDescriptorRequest';
import {GetNearestSiteRequest} from '../../../app/resource/GetNearestSiteRequest';
import {GetDefaultPageTemplateRequest} from '../../../app/wizard/page/GetDefaultPageTemplateRequest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export async function loadPageTemplate(contentId: ContentId): Promise<PageTemplate | undefined> {
    try {
        const request = new GetPageTemplateByKeyRequest(contentId);

        const pageTemplate = await request.sendAndParse();

        return pageTemplate;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

export async function loadComponentDescriptor(content: Content): Promise<Descriptor | undefined> {
    try {
        const request = new GetComponentDescriptorRequest(content.getPage().getController().toString());

        const pageDescriptor = await request.sendAndParse();

        return pageDescriptor;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

export async function loadNearestSite(contentId: ContentId): Promise<Site | undefined> {
    try {
        const request = new GetNearestSiteRequest(contentId);

        const site = await request.sendAndParse();

        return site;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

export async function loadDefaultPageTemplate(
    siteId: ContentId,
    contentType: ContentTypeName
): Promise<PageTemplate | undefined> {
    try {
        const request = new GetDefaultPageTemplateRequest(siteId, contentType);

        const pageTemplate = await request.sendAndParse();

        return pageTemplate;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}
