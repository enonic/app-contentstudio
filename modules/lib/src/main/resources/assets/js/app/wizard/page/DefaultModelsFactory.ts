import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultModels} from './DefaultModels';
import {GetDefaultPageTemplateRequest} from './GetDefaultPageTemplateRequest';
import {PageTemplate} from '../../content/PageTemplate';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {GetComponentDescriptorRequest} from '../../resource/GetComponentDescriptorRequest';
import {PageComponentType} from '../../page/region/PageComponentType';
import {Descriptor} from '../../page/Descriptor';
import {ContentId} from '../../content/ContentId';
import {PageHelper} from '../../util/PageHelper';

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
