import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type ContentVersionActionJson} from './resource/json/ContentVersionActionJson';

export class ContentVersionAction {

    private readonly operation: string;
    private readonly fields: string[];
    private readonly editorial: string | undefined;
    private readonly editorialExists: boolean | undefined;
    private readonly user: PrincipalKey;
    private readonly userDisplayName: string;
    private readonly opTime: Date;

    constructor(builder: ContentVersionActionBuilder) {
        this.operation = builder.operation;
        this.fields = builder.fields;
        this.editorial = builder.editorial;
        this.editorialExists = builder.editorialExists;
        this.user = builder.user;
        this.userDisplayName = builder.userDisplayName;
        this.opTime = builder.opTime;
    }

    getOperation(): string {
        return this.operation;
    }

    getFields(): string[] {
        return this.fields.slice();
    }

    getEditorial(): string | undefined {
        return this.editorial;
    }

    getEditorialExists(): boolean | undefined {
        return this.editorialExists;
    }

    getUser(): PrincipalKey {
        return this.user;
    }

    getUserDisplayName(): string {
        return this.userDisplayName;
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
    editorial: string | undefined;
    editorialExists: boolean | undefined;
    user: PrincipalKey;
    userDisplayName: string;
    opTime: Date;

    setOperation(operation: string): ContentVersionActionBuilder {
        this.operation = operation;
        return this;
    }

    setFields(fields: string[]): ContentVersionActionBuilder {
        this.fields = fields;
        return this;
    }

    setEditorial(editorial: string | undefined): ContentVersionActionBuilder {
        this.editorial = editorial;
        return this;
    }

    setEditorialExists(editorialExists: boolean | undefined): ContentVersionActionBuilder {
        this.editorialExists = editorialExists;
        return this;
    }

    setUser(user: PrincipalKey): ContentVersionActionBuilder {
        this.user = user;
        return this;
    }

    setUserDisplayName(userDisplayName: string): ContentVersionActionBuilder {
        this.userDisplayName = userDisplayName;
        return this;
    }

    setOpTime(opTime: Date): ContentVersionActionBuilder {
        this.opTime = opTime;
        return this;
    }

    fromJson(json: ContentVersionActionJson): ContentVersionActionBuilder {
        this.operation = json.operation;
        this.fields = json.fields;
        this.editorial = json.editorial ?? undefined;
        this.editorialExists = json.editorialExists ?? undefined;
        this.user = json.user ? PrincipalKey.fromString(json.user) : null;
        this.userDisplayName = json.userDisplayName;
        this.opTime = json.opTime ? new Date(Date.parse(json.opTime)) : null;
        return this;
    }

    build(): ContentVersionAction {
        return new ContentVersionAction(this);
    }
}
