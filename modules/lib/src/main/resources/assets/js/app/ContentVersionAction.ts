import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ContentVersionActionJson} from './resource/json/ContentVersionActionJson';

export class ContentVersionAction {

    private readonly operation: string;
    private readonly fields: string[];
    private readonly user: PrincipalKey;
    private readonly opTime: Date;

    constructor(builder: ContentVersionActionBuilder) {
        this.operation = builder.operation;
        this.fields = builder.fields;
        this.user = builder.user;
        this.opTime = builder.opTime;
    }

    getOperation(): string {
        return this.operation;
    }

    getFields(): string[] {
        return this.fields.slice();
    }

    getUser(): PrincipalKey {
        return this.user;
    }

    getOpTime(): Date {
        return this.opTime;
    }

    static fromJson(json: ContentVersionActionJson): ContentVersionAction {
        return new ContentVersionActionBuilder().fromJson(json).build();
    }
}

export class ContentVersionActionBuilder {
    operation: string;
    fields: string[];
    user: PrincipalKey;
    opTime: Date;

    setOperation(operation: string): ContentVersionActionBuilder {
        this.operation = operation;
        return this;
    }

    setFields(fields: string[]): ContentVersionActionBuilder {
        this.fields = fields;
        return this;
    }

    setUser(user: PrincipalKey): ContentVersionActionBuilder {
        this.user = user;
        return this;
    }

    setOpTime(opTime: Date): ContentVersionActionBuilder {
        this.opTime = opTime;
        return this;
    }

    fromJson(json: ContentVersionActionJson): ContentVersionActionBuilder {
        this.operation = json.operation;
        this.fields = json.fields;
        this.user = json.user ? PrincipalKey.fromString(json.user) : null;
        this.opTime = json.opTime ? new Date(Date.parse(json.opTime)) : null;
        return this;
    }

    build(): ContentVersionAction {
        return new ContentVersionAction(this);
    }
}

