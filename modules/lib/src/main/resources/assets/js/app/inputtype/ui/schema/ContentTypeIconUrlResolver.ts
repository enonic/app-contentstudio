import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {IconUrlResolver} from '@enonic/lib-admin-ui/icon/IconUrlResolver';
import {type Schema} from '@enonic/lib-admin-ui/schema/Schema';
import {UrlHelper} from '../../../util/UrlHelper';

export class ContentTypeIconUrlResolver
    extends IconUrlResolver {

    resolve(schema: Schema) {

        return schema.getIconUrl();
    }

    public static getResourcePath(): Path {
        return Path.create().fromString('schema/icon').build();
    }

    static default(): string {
        return UrlHelper.getCmsRestUri(Path.create().fromParent(ContentTypeIconUrlResolver.getResourcePath(),
            'base:structured').build().toString());
    }
}
