import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class PageTemplateKey
    extends ContentId {

    public static fromContentId(id: ContentId): PageTemplateKey {

        return new PageTemplateKey(id.toString());
    }

    public static fromString(s: string): PageTemplateKey {

        return new PageTemplateKey(s);
    }

    constructor(s: string) {
        super(s);
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageTemplateKey)) {
            return false;
        }

        let other = <PageTemplateKey>o;
        return super.equals(other);
    }
}
