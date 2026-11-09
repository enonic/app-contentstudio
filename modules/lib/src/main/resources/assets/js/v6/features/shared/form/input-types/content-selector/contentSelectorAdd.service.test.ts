import { AppError } from '@enonic/ui-utils';
import { errAsync, okAsync } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Content } from '../../../../../../app/content/Content';
import { type Project } from '../../../../../../app/settings/data/project/Project';

const { mockCreateContent, mockOpenEditContentTab, mockNotifyError } = vi.hoisted(() => ({
    mockCreateContent: vi.fn(),
    mockOpenEditContentTab: vi.fn(),
    mockNotifyError: vi.fn(),
}));

vi.mock('../../../../../entities/content/api/createContent.api', () => ({ createContent: mockCreateContent }));
vi.mock('../../../../../shared/lib/url/navigation', () => ({ openEditContentTab: mockOpenEditContentTab }));
vi.mock('../../../../../shared/notifications', () => ({ notifyError: mockNotifyError }));

import { addContentInProjectRoot } from './contentSelectorAdd.service';

const project = { getName: () => 'edited' } as unknown as Project;
const created = { getId: () => 'new-1' } as unknown as Content;

describe('addContentInProjectRoot', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create the content in the project root, open its wizard there as new and resolve its id', async () => {
        mockCreateContent.mockReturnValue(okAsync(created));

        const id = await addContentInProjectRoot('my:type', project);

        expect(mockCreateContent).toHaveBeenCalledWith({ contentType: 'my:type', projectName: 'edited' });
        expect(mockOpenEditContentTab).toHaveBeenCalledWith('new-1', { project: 'edited', displayAsNew: true });
        expect(id).toBe('new-1');
        expect(mockNotifyError).not.toHaveBeenCalled();
    });

    it('should notify the error and resolve undefined when the creation fails', async () => {
        mockCreateContent.mockReturnValue(errAsync(new AppError('boom')));

        const id = await addContentInProjectRoot('my:type', project);

        expect(id).toBeUndefined();
        expect(mockOpenEditContentTab).not.toHaveBeenCalled();
        expect(mockNotifyError).toHaveBeenCalledWith('boom');
    });
});
