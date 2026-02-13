import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentId} from '../content/ContentId';

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

        const other = o as PageTemplateKey;
        return super.equals(other);
    }
}
