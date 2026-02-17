import {type ContentId} from '../../content/ContentId';
import {DefaultModels} from './DefaultModels';
import {type PageTemplate} from '../../content/PageTemplate';
import type Q from 'q';
import {GetDefaultPageTemplateRequest} from './GetDefaultPageTemplateRequest';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export interface DefaultModelsFactoryConfig {

    siteId: ContentId;

    contentType: ContentTypeName;
}

export class DefaultModelsFactory {
    static create(config: DefaultModelsFactoryConfig): Q.Promise<DefaultModels> {
        return new GetDefaultPageTemplateRequest(config.siteId, config.contentType).sendAndParse().then(
            (defaultPageTemplate: PageTemplate) => {
                return new DefaultModels(defaultPageTemplate?.isPage() ? defaultPageTemplate : null);
            });
    }
}
