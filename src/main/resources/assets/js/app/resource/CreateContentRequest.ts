import ContentName = api.content.ContentName;
import ContentPath = api.content.ContentPath;
import Workflow = api.content.Workflow;
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ExtraData} from '../content/ExtraData';
import {ExtraDataJson} from './json/ExtraDataJson';

export class CreateContentRequest
    extends ContentResourceRequest<ContentJson, Content> {

    private valid: boolean;

    private requireValid: boolean;

    private name: ContentName;

    private parent: ContentPath;

    private contentType: api.schema.content.ContentTypeName;

    private data: api.data.PropertyTree;

    private meta: ExtraData[] = [];

    private displayName: string;

    private workflow: Workflow;

    constructor() {
        super();
        this.valid = false;
        this.requireValid = false;
        super.setMethod('POST');
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

    setContentType(value: api.schema.content.ContentTypeName): CreateContentRequest {
        this.contentType = value;
        return this;
    }

    setData(data: api.data.PropertyTree): CreateContentRequest {
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
            name: this.name.isUnnamed() ? ContentName.UNNAMED_PREFIX : this.name.toString(),
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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'create');
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {

            return this.fromJsonToContent(response.getResult());

        });
    }

}
