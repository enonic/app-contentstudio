import {Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {type ExtensionDescriptorJson} from '@enonic/lib-admin-ui/extension/ExtensionDescriptorJson';
import {CmsResourceRequest} from './CmsResourceRequest';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export abstract class ExtensionDescriptorResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return CONFIG.getString('extensionApiUrl');
    }

    constructor() {
        super();
    }

    static fromJson(json: ExtensionDescriptorJson[]): Extension[] {
        const result: Extension[] = [];
        json.forEach((widgetDescriptorJson: ExtensionDescriptorJson) => {
            result.push(Extension.fromJson(widgetDescriptorJson));
        });
        return result;
    }
}
