import {ContentUnnamed} from './ContentUnnamed';
import {ContentPath} from './ContentPath';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';

export class ContentPathPrettifier {

    public static prettifyUnnamedPathElements(path: ContentPath): ContentPath {
        const prettyElements: string[] = [];

        path.getElements().forEach((element: string) => {
            if (element.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0) {
                prettyElements.push('<' + NamePrettyfier.getPrettyUnnamed() + '>');
            } else {
                prettyElements.push(element);
            }
        });

        return ContentPath.create().setElements(prettyElements).build();
    }

}
