import {Path} from 'lib-admin-ui/rest/Path';
import {IconUrlResolver} from 'lib-admin-ui/icon/IconUrlResolver';
import {Schema} from 'lib-admin-ui/schema/Schema';
import {UrlHelper} from '../../../util/UrlHelper';

export class ContentTypeIconUrlResolver
    extends IconUrlResolver {

    resolve(schema: Schema) {

        return schema.getIconUrl();
    }

    public static getResourcePath(): Path {
        return Path.fromString('schema/icon');
    }

    static default(): string {
        return UrlHelper.getCmsRestUri(Path.fromParent(ContentTypeIconUrlResolver.getResourcePath(),
            'base:structured').toString());
    }
}
