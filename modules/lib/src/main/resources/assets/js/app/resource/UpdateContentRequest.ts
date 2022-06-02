import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ExtraData} from '../content/ExtraData';
import {AccessControlList} from '../access/AccessControlList';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentName} from '../content/ContentName';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {Workflow} from '../content/Workflow';

export class UpdateContentRequest
    extends CmsContentResourceRequest<Content> {

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

    static create(content: Content): UpdateContentRequest {
        return new UpdateContentRequest(content.getId())
            .setContentName(content.getName())
            .setDisplayName(content.getDisplayName())
            .setData(content.getContentData())
            .setExtraData(content.getAllExtraData())
            .setOwner(content.getOwner())
            .setLanguage(content.getLanguage())
            .setPublishFrom(content.getPublishFromTime())
            .setPublishTo(content.getPublishToTime())
            .setPermissions(content.getPermissions())
            .setInheritPermissions(content.isInheritPermissionsEnabled())
            .setOverwritePermissions(content.isOverwritePermissionsEnabled())
            .setWorkflow(content.getWorkflow());
    }

    getParams(): Object {
        const contentName: string = this.name.isUnnamed() ? this.name.getValue() : this.name.toString();

        return {
            contentId: this.id,
            requireValid: this.requireValid,
            contentName: !!contentName ? contentName.trim() : '',
            data: this.data.toJson(),
            meta: (this.meta || []).map((extraData: ExtraData) => extraData.toJson()),
            displayName: !!this.displayName ? this.displayName.trim() : '',
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
