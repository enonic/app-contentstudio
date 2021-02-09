import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DefaultModels} from './DefaultModels';
import {GetDefaultPageTemplateRequest} from './GetDefaultPageTemplateRequest';
import {GetPageDescriptorByKeyRequest} from '../../resource/GetPageDescriptorByKeyRequest';
import {PageTemplate} from '../../content/PageTemplate';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {Exception, ExceptionType} from 'lib-admin-ui/Exception';

export interface DefaultModelsFactoryConfig {

    siteId: ContentId;

    contentType: ContentTypeName;

    applications: ApplicationKey[];
}

export class DefaultModelsFactory {

    static create(config: DefaultModelsFactoryConfig): Q.Promise<DefaultModels> {

        return new GetDefaultPageTemplateRequest(config.siteId, config.contentType).sendAndParse().then(
            (defaultPageTemplate: PageTemplate) => {

                let defaultPageTemplateDescriptorPromise = null;
                if (defaultPageTemplate && defaultPageTemplate.isPage()) {
                    defaultPageTemplateDescriptorPromise =
                        new GetPageDescriptorByKeyRequest(defaultPageTemplate.getController()).sendAndParse();
                } else if (defaultPageTemplate && !defaultPageTemplate.isPage()) {
                    defaultPageTemplate = null;
                }

                let deferred = Q.defer<DefaultModels>();
                if (defaultPageTemplateDescriptorPromise) {
                    defaultPageTemplateDescriptorPromise.then((defaultPageTemplateDescriptor: PageDescriptor) => {

                        deferred.resolve(new DefaultModels(defaultPageTemplate, defaultPageTemplateDescriptor));
                    }).catch((reason) => {
                        const msg = i18n('notify.wizard.noDescriptor', defaultPageTemplate.getController());
                        deferred.reject(new Exception(msg, ExceptionType.WARNING));
                    }).done();
                } else {
                    deferred.resolve(new DefaultModels(defaultPageTemplate, null));
                }

                return deferred.promise;
            });
    }
}
