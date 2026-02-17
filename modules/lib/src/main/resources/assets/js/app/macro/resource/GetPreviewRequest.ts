import {type ContentPath} from '../../content/ContentPath';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {type MacroKey} from '@enonic/lib-admin-ui/macro/MacroKey';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PreviewRequest} from './PreviewRequest';
import {type MacroPreviewJson} from './MacroPreviewJson';
import {MacroPreview} from '../MacroPreview';

export class GetPreviewRequest
    extends PreviewRequest<MacroPreview> {

    protected path: ContentPath;

    constructor(data: PropertyTree, macroKey: MacroKey, path: ContentPath) {
        super(data, macroKey);
        this.path = path;
        this.addRequestPathElements('preview');
    }

    getParams(): object {
        return {
            form: this.data.toJson(),
            contentPath: this.path ? this.path.toString() : '',
            macroKey: this.macroKey.getRefString()
        };
    }

    protected parseResponse(response: JsonResponse<MacroPreviewJson>): MacroPreview {
        return MacroPreview.create().fromJson(response.getResult()).build();
    }
}
