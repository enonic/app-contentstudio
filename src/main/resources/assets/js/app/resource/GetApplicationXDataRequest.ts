import MixinResourceRequest = api.schema.mixin.MixinResourceRequest;
import MixinListJson = api.schema.mixin.MixinListJson;
import Mixin = api.schema.mixin.Mixin;
import MixinJson = api.schema.mixin.MixinJson;
import ContentTypeName = api.schema.content.ContentTypeName;
import ApplicationKey = api.application.ApplicationKey;

export class GetApplicationXDataRequest
    extends MixinResourceRequest<MixinListJson, Mixin[]> {

    private contentTypeName: ContentTypeName;

    private applicationKey: ApplicationKey;

    constructor(contentTypeName: ContentTypeName, applicationKey: ApplicationKey) {
        super();
        super.setMethod('GET');
        this.contentTypeName = contentTypeName;
        this.applicationKey = applicationKey;
    }

    getParams(): Object {
        return {
            contentTypeName: this.contentTypeName.toString(),
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'getApplicationXDataForContentType');
    }

    sendAndParse(): wemQ.Promise<Mixin[]> {

        return this.send().then((response: api.rest.JsonResponse<MixinListJson>) => {
            return response.getResult().mixins.map((mixinJson: MixinJson) => {
                return this.fromJsonToMixin(mixinJson);
            });
        });
    }
}
