import { act, cleanup, render } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { ContentSummaryBuilder, type ContentSummary } from '../../../../../../app/content/ContentSummary';
import { fetchContentByIds } from '../../../../../entities/content';
import { handleError } from '../../../../../shared/notifications';
import { ContentStatusIcon } from '../../../../../shared/ui/icons/ContentStatusIcon';
import { SelectorSelection } from './SelectorSelection';
import { SelectorSelectionItem } from './SelectorSelectionItem';

vi.unmock('@enonic/ui');
vi.mock('../../../../../entities/content', () => ({ fetchContentByIds: vi.fn() }));
vi.mock('../../../../../shared/notifications', () => ({ handleError: vi.fn() }));
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('../../../../../../app/event/EditContentEvent', () => ({ EditContentEvent: vi.fn() }));
vi.mock('../../../../../shared/socket/socket.store', () => {
    const event = { listen: () => () => {} };
    return {
        $contentArchived: event,
        $contentDeleted: event,
        $contentMoved: event,
        $contentPublished: event,
        $contentRenamed: event,
        $contentUnpublished: event,
        $contentUpdated: event,
    };
});

const contents = ['first', 'second'].map((id) =>
    new ContentSummaryBuilder()
        .setId(id)
        .setDisplayName(id)
        .setPath(ContentPath.create().fromString(`/${id}`).build())
        .build(),
);

const Selection = ({ selection, projectName = 'default' }: { selection: readonly string[]; projectName?: string }) => (
    <SelectorSelection
        selection={selection}
        projectName={projectName}
        onSelectionChange={vi.fn()}
        renderItem={(context) => (
            <SelectorSelectionItem
                project={undefined}
                context={context}
                selection={selection}
                onSelectionChange={vi.fn()}
                status="invalid"
                renderContent={() => <ContentStatusIcon status="invalid" />}
            />
        )}
    />
);

const getItems = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-component="SelectorSelectionItem"]'));

function deferred() {
    let resolve: (contents: ContentSummary[]) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<ContentSummary[]>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    vi.mocked(fetchContentByIds).mockReset();
    vi.mocked(handleError).mockReset();
});

afterEach(cleanup);

it('keeps focus eligibility aligned with rendered items while the selection grows and shrinks', async () => {
    vi.mocked(fetchContentByIds).mockResolvedValueOnce(contents.slice(0, 1));
    const view = render(<Selection selection={['first']} />);
    await act(async () => {});
    const [first] = getItems();
    expect(first.tabIndex).toBe(0);

    const growing = deferred();
    vi.mocked(fetchContentByIds).mockReturnValueOnce(growing.promise);
    view.rerender(<Selection selection={['first', 'second']} />);
    await act(async () => {});
    expect(getItems()).toEqual([first]);
    expect(first.tabIndex).toBe(0);
    expect(first.parentElement!.hasAttribute('tabindex')).toBe(false);

    await act(async () => growing.resolve(contents));
    expect(getItems()).toHaveLength(2);
    expect(getItems()[0]).toBe(first);
    expect(first.hasAttribute('tabindex')).toBe(false);
    expect(first.parentElement!.tabIndex).toBe(0);

    const shrinking = deferred();
    vi.mocked(fetchContentByIds).mockReturnValueOnce(shrinking.promise);
    view.rerender(<Selection selection={['first']} />);
    await act(async () => {});
    expect(getItems()).toHaveLength(2);
    expect(first.hasAttribute('tabindex')).toBe(false);
    expect(first.parentElement!.tabIndex).toBe(0);

    await act(async () => shrinking.resolve(contents.slice(0, 1)));
    expect(getItems()).toEqual([first]);
    expect(first.tabIndex).toBe(0);
    expect(first.parentElement!.hasAttribute('tabindex')).toBe(false);
});

it('reports a failed fetch and keeps the displayed single item keyboard reachable', async () => {
    vi.mocked(fetchContentByIds).mockResolvedValueOnce(contents.slice(0, 1));
    const view = render(<Selection selection={['first']} />);
    await act(async () => {});
    const [first] = getItems();

    const error = new Error('Could not load second item');
    vi.mocked(fetchContentByIds).mockRejectedValueOnce(error);
    view.rerender(<Selection selection={['first', 'second']} />);
    await act(async () => {});
    expect(handleError).toHaveBeenCalledExactlyOnceWith(error);
    expect(getItems()).toEqual([first]);
    expect(first.tabIndex).toBe(0);
});

it.each(['result', 'error'])('ignores a stale %s after a newer selection has loaded', async (outcome) => {
    const oldRequest = deferred();
    const newerRequest = deferred();
    vi.mocked(fetchContentByIds).mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newerRequest.promise);
    const view = render(<Selection selection={['first']} />);
    await act(async () => {});
    view.rerender(<Selection selection={['second']} />);
    await act(async () => {});
    await act(async () => newerRequest.resolve([contents[1]]));
    expect(getItems()[0].getAttribute('aria-label')).toBe('second');
    await act(async () => {
        if (outcome === 'result') oldRequest.resolve([contents[0]]);
        else oldRequest.reject(new Error('Stale request'));
    });
    expect(handleError).not.toHaveBeenCalled();
    expect(getItems()[0].getAttribute('aria-label')).toBe('second');
});

it('ignores errors after unmounting the selector', async () => {
    const request = deferred();
    vi.mocked(fetchContentByIds).mockReturnValueOnce(request.promise);
    const view = render(<Selection selection={['first']} />);
    await act(async () => {});
    view.unmount();
    await act(async () => request.reject(new Error('Unmounted request')));
    expect(handleError).not.toHaveBeenCalled();
});
