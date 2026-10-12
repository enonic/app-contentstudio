import { okAsync } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import { setupFileUpload } from './fileUpload';

const mocks = vi.hoisted(() => ({
    contentExistsByPath: vi.fn(),
}));

vi.mock('../../../../../entities/content/api/contentExists.api', () => ({
    contentExistsByPath: mocks.contentExistsByPath,
}));

type Handler = (evt: unknown) => void;

function summaryAt(path: string): ContentSummary {
    return { getPath: () => ContentPath.create().fromString(path).build() } as unknown as ContentSummary;
}

function createEditorStub(): { editor: CKEDITOR.editor; handlers: Record<string, Handler> } {
    const handlers: Record<string, Handler> = {};
    const editor = {
        on: (name: string, handler: Handler) => {
            handlers[name] = handler;
        },
        widgets: undefined,
    } as unknown as CKEDITOR.editor;

    return { editor, handlers };
}

function createUploadEvent() {
    const xhr = { open: vi.fn(), send: vi.fn() };
    const fileLoader = { fileName: 'img.png', file: new File(['x'], 'img.png'), uploadUrl: '/upload', xhr };
    const evt = { data: { fileLoader }, stop: vi.fn(), editor: { document: { findOne: () => undefined } } };

    return { evt, xhr };
}

beforeEach(() => {
    mocks.contentExistsByPath.mockReset();
    mocks.contentExistsByPath.mockReturnValue(okAsync(false));
});

describe('setupFileUpload', () => {
    it('should resolve the parent content at upload time, not at setup time', async () => {
        let current: ContentSummary | undefined = summaryAt('/site/__unnamed__abc');
        const { editor, handlers } = createEditorStub();

        setupFileUpload(editor, () => current, undefined);

        current = summaryAt('/site/test5557');

        const { evt, xhr } = createUploadEvent();
        handlers.fileUploadRequest(evt);

        await vi.waitFor(() => expect(xhr.send).toHaveBeenCalledTimes(1));

        expect(mocks.contentExistsByPath).toHaveBeenCalledWith('/site/test5557/img.png');
        const formData = xhr.send.mock.calls[0][0] as FormData;
        expect(formData.get('parent')).toBe('/site/test5557');
        expect(formData.get('name')).toBe('img.png');
        expect(xhr.open).toHaveBeenCalledWith('POST', '/upload', true);
        expect(evt.stop).toHaveBeenCalled();
    });

    it('should not upload when there is no current content', () => {
        const { editor, handlers } = createEditorStub();

        setupFileUpload(editor, () => undefined, undefined);

        const { evt, xhr } = createUploadEvent();
        handlers.fileUploadRequest(evt);

        expect(mocks.contentExistsByPath).not.toHaveBeenCalled();
        expect(xhr.send).not.toHaveBeenCalled();
    });
});
