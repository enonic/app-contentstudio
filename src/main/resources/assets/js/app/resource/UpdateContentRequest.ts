import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentName} from 'lib-admin-ui/content/ContentName';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ExtraData} from '../content/ExtraData';
import {AccessControlList} from '../access/AccessControlList';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class UpdateContentRequest
    extends ContentResourceRequest<Content> {

    private id: string;

    private name: ContentName;

    private data: PropertyTree;

    private meta: ExtraData[];

    private displayName: string;

    private requireValid: boolean;

    private language: string;

    private owner: PrincipalKey;

    private publishFrom: Date;

    private publishTo: Date;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwritePermissions: boolean;

    private workflow: Workflow;

    constructor(id: string) {
        super();
        this.id = id;
        this.requireValid = false;
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('update');
    }

    setId(id: string): UpdateContentRequest {
        this.id = id;
        return this;
    }

    setContentName(value: ContentName): UpdateContentRequest {
        this.name = value;
        return this;
    }

    setData(contentData: PropertyTree): UpdateContentRequest {
        this.data = contentData;
        return this;
    }

    setExtraData(extraData: ExtraData[]): UpdateContentRequest {
        this.meta = extraData;
        return this;
    }

    setDisplayName(displayName: string): UpdateContentRequest {
        this.displayName = displayName;
        return this;
    }

    setRequireValid(requireValid: boolean): UpdateContentRequest {
        this.requireValid = requireValid;
        return this;
    }

    setLanguage(language: string): UpdateContentRequest {
        this.language = language;
        return this;
    }

    setOwner(owner: PrincipalKey): UpdateContentRequest {
        this.owner = owner;
        return this;
    }

    setPublishFrom(date: Date): UpdateContentRequest {
        this.publishFrom = date;
        return this;
    }

    setPublishTo(date: Date): UpdateContentRequest {
        this.publishTo = date;
        return this;
    }

    setPermissions(permissions: AccessControlList): UpdateContentRequest {
        this.permissions = permissions;
        return this;
    }

    setInheritPermissions(inheritPermissions: boolean): UpdateContentRequest {
        this.inheritPermissions = inheritPermissions;
        return this;
    }

    setOverwritePermissions(overwritePermissions: boolean): UpdateContentRequest {
        this.overwritePermissions = overwritePermissions;
        return this;
    }

    setWorkflow(workflow: Workflow): UpdateContentRequest {
        this.workflow = workflow;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.id,
            requireValid: this.requireValid,
            contentName: this.name.isUnnamed() ? this.name.getValue() : this.name.toString(),
            data: this.data.toJson(),
            meta: (this.meta || []).map((extraData: ExtraData) => extraData.toJson()),
            displayName: this.displayName,
            language: this.language,
            owner: this.owner ? this.owner.toString() : undefined,
            publishFrom: this.publishFrom,
            publishTo: this.publishTo,
            permissions: this.permissions ? this.permissions.toJson() : undefined,
            inheritPermissions: this.inheritPermissions,
            overwriteChildPermissions: this.overwritePermissions,
            workflow: this.workflow.toJson()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
