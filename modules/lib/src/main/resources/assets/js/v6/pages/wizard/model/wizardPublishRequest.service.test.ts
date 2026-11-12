import { okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    findOpenIssues: vi.fn(),
    openIssueDialogDetails: vi.fn(),
    patchFacts: vi.fn(),
    issueListeners: [] as (() => void)[],
}));

vi.mock('../../../entities/issue/api/issues.api', () => ({ findOpenIssues: mocks.findOpenIssues }));
vi.mock('../../../features/issues/model/issueDialog.store', () => ({
    openIssueDialogDetails: mocks.openIssueDialogDetails,
}));
vi.mock('../../../shared/notifications', () => ({ handleError: vi.fn() }));
vi.mock('./wizardActions.store', () => ({ patchWizardActionFacts: mocks.patchFacts }));
vi.mock('../../../../app/issue/IssueType', () => ({ IssueType: { STANDARD: 0, PUBLISH_REQUEST: 1 } }));
vi.mock('../../../../app/issue/event/IssueServerEventsHandler', () => ({
    IssueServerEventsHandler: {
        getInstance: () => ({
            onIssueCreated: (listener: () => void) => mocks.issueListeners.push(listener),
            onIssueUpdated: (listener: () => void) => mocks.issueListeners.push(listener),
            unIssueCreated: () => undefined,
            unIssueUpdated: () => undefined,
        }),
    },
}));

import { openWizardPublishRequest, refreshWizardPublishRequest, start, stop } from './wizardPublishRequest.service';

const issue = (id: string, type: number) => ({ getId: () => id, getType: () => type });

describe('wizardPublishRequest.service', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.findOpenIssues.mockReset().mockReturnValue(okAsync([]));
        mocks.openIssueDialogDetails.mockReset();
        mocks.patchFacts.mockReset();
        mocks.issueListeners.length = 0;
        start();
    });

    afterEach(() => {
        stop();
        vi.useRealTimers();
    });

    it('should look for the publish request as soon as the content is known', async () => {
        mocks.findOpenIssues.mockReturnValue(okAsync([issue('task', 0), issue('request', 1)]));

        refreshWizardPublishRequest('content');
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.findOpenIssues).toHaveBeenCalledWith('content');
        expect(mocks.patchFacts).toHaveBeenLastCalledWith({ hasPublishRequest: true });

        openWizardPublishRequest();
        expect(mocks.openIssueDialogDetails).toHaveBeenCalledWith('request');
    });

    it('should take the oldest publish request when the content is in several', async () => {
        mocks.findOpenIssues.mockReturnValue(okAsync([issue('newer', 1), issue('older', 1)]));

        refreshWizardPublishRequest('content');
        await vi.advanceTimersByTimeAsync(0);
        openWizardPublishRequest();

        expect(mocks.openIssueDialogDetails).toHaveBeenCalledWith('older');
    });

    it('should report no publish request and open nothing when there is none', async () => {
        mocks.findOpenIssues.mockReturnValue(okAsync([issue('task', 0)]));

        refreshWizardPublishRequest('content');
        await vi.advanceTimersByTimeAsync(0);
        openWizardPublishRequest();

        expect(mocks.patchFacts).toHaveBeenLastCalledWith({ hasPublishRequest: false });
        expect(mocks.openIssueDialogDetails).not.toHaveBeenCalled();
    });

    it('should look again, once, after a burst of content updates and issue changes', async () => {
        refreshWizardPublishRequest('content');
        await vi.advanceTimersByTimeAsync(0);

        refreshWizardPublishRequest('content');
        mocks.issueListeners.forEach((listener) => listener());
        await vi.advanceTimersByTimeAsync(500);

        expect(mocks.findOpenIssues).toHaveBeenCalledTimes(2);
    });

    it('should ignore issue changes before the content is known', async () => {
        mocks.issueListeners.forEach((listener) => listener());
        await vi.advanceTimersByTimeAsync(500);

        expect(mocks.findOpenIssues).not.toHaveBeenCalled();
    });
});
