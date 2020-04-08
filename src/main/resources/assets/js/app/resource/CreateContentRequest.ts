import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentName} from 'lib-admin-ui/content/ContentName';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ExtraData} from '../content/ExtraData';
import {ExtraDataJson} from './json/ExtraDataJson';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class CreateContentRequest
    extends ContentResourceRequest<Content> {

    private valid: boolean;

    private requireValid: boolean;

    private name: ContentName;

    private parent: ContentPath;

    private contentType: ContentTypeName;

    private data: PropertyTree;

    private meta: ExtraData[] = [];

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

    setExtraData(extraData: ExtraData[]): CreateContentRequest {
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

    getParams(): Object {
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

    private extraDataToJson(): ExtraDataJson[] {
        return this.meta ? this.meta.map((extraData: ExtraData) => extraData.toJson()) : null;
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
