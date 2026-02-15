import {type IssueCommentJson} from './json/IssueCommentJson';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class IssueComment {

    private id: string;

    private creatorKey: PrincipalKey;

    private creatorDisplayName: string;

    private text: string;

    private createdTime: Date;

    constructor(builder: IssueCommentBuilder) {
        this.id = builder.id;
        this.creatorKey = builder.creatorKey;
        this.creatorDisplayName = builder.creatorDisplayName;
        this.text = builder.text;
        this.createdTime = builder.createdTime;
    }

    getId(): string {
        return this.id;
    }

    getCreatorKey(): PrincipalKey {
        return this.creatorKey;
    }

    getCreatorDisplayName(): string {
        return this.creatorDisplayName;
    }

    getText(): string {
        return this.text;
    }

    getCreatedTime(): Date {
        return this.createdTime;
    }

    static fromJson(json: IssueCommentJson): IssueComment {
        const createdTime = json.createdTime ? new Date(Date.parse(json.createdTime)) : null;
        return IssueComment.create()
            .setId(json.id)
            .setCreatorKey(PrincipalKey.fromString(json.creatorKey))
            .setCreatorDisplayName(json.creatorDisplayName)
            .setText(json.text)
            .setCreatedTime(createdTime)
            .build();
    }

    static create(): IssueCommentBuilder {
        return new IssueCommentBuilder();
    }

}

class IssueCommentBuilder {

    id: string;

    creatorKey: PrincipalKey;

    creatorDisplayName: string;

    text: string;

    createdTime: Date;

    constructor() {
        this.createdTime = new Date();
    }

    setId(id: string): IssueCommentBuilder {
        this.id = id;
        return this;
    }

    setCreatorKey(key: PrincipalKey): IssueCommentBuilder {
        this.creatorKey = key;
        return this;
    }

    setCreatorDisplayName(name: string): IssueCommentBuilder {
        this.creatorDisplayName = name;
        return this;
    }

    setText(text: string): IssueCommentBuilder {
        this.text = text;
        return this;
    }

    setCreatedTime(time: Date): IssueCommentBuilder {
        this.createdTime = time;
        return this;
    }

    build(): IssueComment {
        return new IssueComment(this);
    }
}
