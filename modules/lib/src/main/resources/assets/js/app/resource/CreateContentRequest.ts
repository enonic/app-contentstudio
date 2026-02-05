import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {Mixin} from '../content/Mixin';
import {MixinJson} from './json/MixinJson';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {Workflow} from '../content/Workflow';

export class CreateContentRequest
    extends CmsContentResourceRequest<Content> {

    private valid: boolean;

    private requireValid: boolean;

    private name: ContentName;

    private parent: ContentPath;

    private contentType: ContentTypeName;

    private data: PropertyTree;

    private meta: Mixin[] = [];

    private displayName: string;

    private workflow: Workflow;

    constructor() {
        super();
        this.valid = false;
        this.requireValid = false;
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('create');
    }

    setValid(value: boolean): CreateContentRequest {
        this.valid = value;
        return this;
    }

    setRequireValid(value: boolean): CreateContentRequest {
        this.requireValid = value;
        return this;
    }

    setName(value: ContentName): CreateContentRequest {
        this.name = value;
        return this;
    }

    setParent(value: ContentPath): CreateContentRequest {
        this.parent = value;
        return this;
    }

    setContentType(value: ContentTypeName): CreateContentRequest {
        this.contentType = value;
        return this;
    }

    setData(data: PropertyTree): CreateContentRequest {
        this.data = data;
        return this;
    }

    setExtraData(extraData: Mixin[]): CreateContentRequest {
        this.meta = extraData;
        return this;
    }

    setDisplayName(displayName: string): CreateContentRequest {
        this.displayName = displayName;
        return this;
    }

    setWorkflow(workflow: Workflow): CreateContentRequest {
        this.workflow = workflow;
        return this;
    }

    getParams(): object {
        return {
            valid: this.valid,
            requireValid: this.requireValid,
            name: this.name.isUnnamed() ? ContentUnnamed.UNNAMED_PREFIX : this.name.toString(),
            parent: this.parent.toString(),
            contentType: this.contentType.toString(),
            data: this.data.toJson(),
            meta: this.extraDataToJson(),
            displayName: this.displayName,
            workflow: this.workflow.toJson()
        };
    }

    private extraDataToJson(): MixinJson[] {
        return this.meta ? this.meta.map((extraData: Mixin) => extraData.toJson()) : null;
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
