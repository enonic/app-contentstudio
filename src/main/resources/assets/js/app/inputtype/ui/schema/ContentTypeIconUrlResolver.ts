import IconUrlResolver = api.icon.IconUrlResolver;
import Path = api.rest.Path;
import Schema = api.schema.Schema;

export class ContentTypeIconUrlResolver
    extends IconUrlResolver {

    resolve(schema: Schema) {

        return schema.getIconUrl();
    }

    public static getResourcePath(): Path {
        return api.rest.Path.fromString('schema/icon');
    }

    static default(): string {
        return api.util.UriHelper.getRestUri(Path.fromParent(ContentTypeIconUrlResolver.getResourcePath(),
            'base:structured').toString());
    }
}
