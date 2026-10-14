/*global CKEDITOR*/

import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { NotifyManager } from '@enonic/lib-admin-ui/notify/NotifyManager';
import { i18n } from '../../../../../shared/i18n';
import { StringHelper } from '@enonic/lib-admin-ui/util/StringHelper';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import { StyleHelper } from '../../../../../../app/inputtype/ui/text/styles/StyleHelper';
import type { Project } from '../../../../../../app/settings/data/project/Project';
import { contentExistsByPath } from '../../../../../entities/content/api/contentExists.api';
import { buildImagePreviewUrl, buildImageRenderUrl } from '../../../../../shared/lib/url/images';

type EventInfo = CKEDITOR.eventInfo;

/**
 * Wires drag-and-drop / paste image upload into the editor.
 *
 * The parent content is resolved through `getContentSummary` at upload time rather than
 * captured once at setup: a new content starts with an `__unnamed__…` path that changes
 * when it is saved, and the editor is only set up once per CKEditor instance.
 */
export function setupFileUpload(
    editor: CKEDITOR.editor,
    getContentSummary: () => ContentSummary | undefined,
    project: Readonly<Project> | undefined,
): void {
    // Wrapping dropped image into figure element — called after editor is ready,
    // so modify uploadimage widget directly (no instanceReady wrapper needed).
    if (editor.widgets?.registered?.uploadimage) {
        editor.widgets.registered.uploadimage['onUploaded'] = function (upload) {
            const imageId = StringHelper.substringBetween(upload.url, 'image/', '?');
            const dataSrc = buildImageRenderUrl(imageId);

            this['replaceWith'](
                `<figure class="captioned ${StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS}">` +
                    `<img src="${upload.url}" data-src="${dataSrc}" style="width:100%">` +
                    '<figcaption> </figcaption>' +
                    '</figure>',
            );

            editor.fire('change');
        };
    }

    // Validate file doesn't already exist before upload
    editor.on('fileUploadRequest', (evt: EventInfo) => {
        const fileLoader = evt.data.fileLoader;
        const contentSummary = getContentSummary();

        if (!contentSummary) {
            // Stop CKEditor's default handler, which would otherwise send the file without a parent
            evt.editor.document.findOne('.cke_widget_uploadimage')?.remove();
            evt.stop();
            return;
        }

        const parentPath = contentSummary.getPath();
        const contentPathAsString = ContentPath.create().fromParent(parentPath, fileLoader.fileName).build().toString();

        void contentExistsByPath(contentPathAsString).match((exists) => {
            if (exists) {
                NotifyManager.get().showWarning(i18n('notify.fileExists', fileLoader.fileName));
                evt.editor.document.findOne('.cke_widget_uploadimage')?.remove();
            } else {
                const formData = new FormData();
                const xhr = fileLoader.xhr;

                xhr.open('POST', fileLoader.uploadUrl, true);
                formData.append('file', fileLoader.file, fileLoader.fileName);
                formData.append('parent', parentPath.toString());
                formData.append('name', fileLoader.fileName);

                fileLoader.xhr.send(formData);
            }
        }, DefaultErrorHandler.handle);

        evt.stop();
    });

    // Parse image upload response
    editor.on('fileUploadResponse', (evt: EventInfo) => {
        evt.stop();

        const data = evt.data;
        const xhr = data.fileLoader.xhr;
        const response = xhr.responseText.split('|');

        if (response[1]) {
            data.message = response[1];
            evt.cancel();
        } else {
            const mediaContent = JSON.parse(response[0]);

            const imgUrl = buildImagePreviewUrl({
                contentId: mediaContent.id,
                projectName: project?.getName(),
                scaleWidth: true,
            });

            data.url = imgUrl;
        }
    });
}
