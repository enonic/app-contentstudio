import type { PropertyTree } from '@enonic/input-types/data';
import { type MacroKey } from '@enonic/lib-admin-ui/macro/MacroKey';
import { type JsonResponse } from '@enonic/lib-admin-ui/rest/JsonResponse';
import { PreviewRequest } from './PreviewRequest';
import { type MacroPreviewStringJson } from './MacroPreviewJson';

export class GetPreviewStringRequest extends PreviewRequest<string> {
    constructor(data: PropertyTree, macroKey: MacroKey) {
        super(data, macroKey);
        this.addRequestPathElements('previewString');
    }

    protected parseResponse(response: JsonResponse<MacroPreviewStringJson>): string {
        return response.getResult().macro;
    }
}
