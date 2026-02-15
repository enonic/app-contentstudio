import {IssueSummary, IssueSummaryBuilder} from './IssueSummary';
import {PublishRequest} from './PublishRequest';
import {type IssueJson} from './json/IssueJson';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class Issue
    extends IssueSummary {

    private approvers: PrincipalKey[];

    private publishRequest: PublishRequest;

    private publishFrom: Date;

    private publishTo: Date;

    constructor(builder: IssueBuilder) {
        super(builder);

        this.approvers = builder.approvers;
        this.publishRequest = builder.publishRequest;
        this.publishFrom = builder.publishFrom;
        this.publishTo = builder.publishTo;
    }

    public getApprovers(): PrincipalKey[] {
        return this.approvers;
    }

    public getPublishRequest(): PublishRequest {
        return this.publishRequest;
    }

    public getPublishFrom(): Date {
        return this.publishFrom;
    }

    public getPublishTo(): Date {
        return this.publishTo;
    }

    static fromJson(json: IssueJson): Issue {
        return new IssueBuilder().fromJson(json).build();
    }

    static create(): IssueBuilder {
        return new IssueBuilder();
    }
}

export class IssueBuilder
    extends IssueSummaryBuilder {

    approvers: PrincipalKey[] = [];

    publishRequest: PublishRequest;

    publishFrom: Date;

    publishTo: Date;

    fromJson(json: IssueJson): IssueBuilder {
        super.fromJson(json);
        this.approvers = json.approverIds ? json.approverIds.map(approver => PrincipalKey.fromString(approver)) : [];
        this.publishRequest = json.publishRequest ? PublishRequest.create().fromJson(json.publishRequest).build() : null;
        if (json.publishSchedule) {
            const schedule = json.publishSchedule;
            this.publishFrom = schedule.from ? new Date(Date.parse(schedule.from)) : null;
            this.publishTo = schedule.to ? new Date(Date.parse(schedule.to)) : null;
        }

        return this;
    }

    setApprovers(value: PrincipalKey[]): IssueBuilder {
        this.approvers = value;
        return this;
    }

    setPublishRequest(value: PublishRequest): IssueBuilder {
        this.publishRequest = value;
        return this;
    }

    setPublishFrom(value: Date): IssueBuilder {
        this.publishFrom = value;
        return this;
    }

    setPublishTo(value: Date): IssueBuilder {
        this.publishTo = value;
        return this;
    }

    build(): Issue {
        return new Issue(this);
    }
}
