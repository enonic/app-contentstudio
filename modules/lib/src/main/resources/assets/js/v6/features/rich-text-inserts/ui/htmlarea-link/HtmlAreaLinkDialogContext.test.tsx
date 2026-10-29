import { act, cleanup, fireEvent, renderHook, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    HtmlAreaLinkDialogProvider,
    type OpenHtmlAreaLinkDialogParams,
    type UrlProtocol,
    useHtmlAreaLinkDialogContext,
} from './HtmlAreaLinkDialogContext';
import { UrlTabPanel } from './UrlTabPanel';
import type { Project } from '../../../../../app/settings/data/project/Project';
import { fetchContentById } from '../../../../entities/content';

vi.unmock('@enonic/ui');
vi.mock('../../../../shared/i18n', () => ({ i18n: (key: string) => key }));
vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => (key === 'dialog.link.urlprotocols.relative' ? 'Relative' : key),
}));
vi.mock('../../../../entities/content', async () => {
    const { okAsync } = await import('neverthrow');
    return { fetchContentById: vi.fn(() => okAsync(undefined)) };
});
vi.mock('../../../../../app/inputtype/ui/text/HTMLAreaHelper', () => ({ HTMLAreaHelper: { isNbsp: () => false } }));

beforeEach(() => {
    vi.stubGlobal('CKEDITOR', {
        dom: { element: class {} },
        plugins: { link: { getEditorAnchors: () => [] } },
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

function openDialog(protocol: UrlProtocol = '', address = '', project?: Project) {
    const field = (value = '') => ({ getValue: () => value, setValue: vi.fn() });
    const url = field(address);
    const nativeProtocol = field(protocol);
    const click = vi.fn();
    const fields = {
        linkType: field('url'),
        urlOptions: { getChild: (path: number[]) => (path[1] === 0 ? nativeProtocol : url) },
        emailOptions: { getChild: () => field() },
        linkTargetType: field(),
        advTitle: field(),
    };
    const ckeDialog = {
        getContentElement: (_tab: string, name: string) => fields[name],
        getValueOf: () => 'Link',
        setValueOf: vi.fn(),
        getElement: () => ({ $: document.createElement('div') }),
        getButton: () => ({ click }),
        hide: vi.fn(),
    } as unknown as CKEDITOR.dialog;
    const ckeEditor = {
        getSelection: () => ({ getSelectedElement: () => null, getSelectedText: () => '', getRanges: () => [] }),
        focusManager: { add: vi.fn() },
        fire: vi.fn(),
    } as unknown as CKEDITOR.editor;
    const openRef = { current: undefined as ((params: OpenHtmlAreaLinkDialogParams) => void) | undefined };
    const { result } = renderHook(useHtmlAreaLinkDialogContext, {
        wrapper: ({ children }) => (
            <HtmlAreaLinkDialogProvider openRef={openRef}>
                {children}
                <UrlTabPanel />
            </HtmlAreaLinkDialogProvider>
        ),
    });
    act(() => openRef.current({ ckeDialog, ckeEditor, project }));
    const activeTabOnOpen = result.current.state.activeTab;
    act(() => result.current.setActiveTab('url'));
    return {
        result,
        url,
        nativeProtocol,
        click,
        activeTabOnOpen,
        input: screen.getByRole('textbox') as HTMLInputElement,
    };
}

const project = { getName: () => 'a' } as unknown as Project;

describe('link dialog tabs', () => {
    it('opens on the URL tab when there is no project', () => {
        expect(openDialog().activeTabOnOpen).toBe('url');
    });

    it('opens on the content tab when there is a project', () => {
        expect(openDialog('', '', project).activeTabOnOpen).toBe('content');
    });
});

describe('content link without a project', () => {
    beforeEach(() => {
        vi.mocked(fetchContentById).mockClear();
    });

    it('opens on the content tab, keeps the link for display, selects and fetches nothing', () => {
        const { activeTabOnOpen, result } = openDialog('', 'content://abc');

        expect(activeTabOnOpen).toBe('content');
        expect(result.current.state.uneditableLink).toBe('content://abc');
        expect(result.current.state.selectedContentId).toBeUndefined();
        expect(fetchContentById).not.toHaveBeenCalled();
    });

    it('keeps a media link for display', () => {
        expect(openDialog('', 'media://download/def').result.current.state.uneditableLink).toBe('media://download/def');
    });

    it('has nothing to display for a plain URL', () => {
        expect(openDialog('https://', 'example.com').result.current.state.uneditableLink).toBe('');
    });

    it('can submit and writes the link back unchanged', () => {
        const { result, url, click } = openDialog('', 'media://download/def');

        act(() => result.current.setActiveTab('content'));
        expect(result.current.canSubmit).toBe(true);

        act(() => result.current.submit());

        expect(url.setValue).toHaveBeenCalledWith('media://download/def', false);
        expect(click).toHaveBeenCalledOnce();
    });
});

describe('content link with a project', () => {
    beforeEach(() => {
        vi.mocked(fetchContentById).mockClear();
    });

    it('selects and fetches the content, displays nothing and waits for it to submit', () => {
        const { result } = openDialog('', 'content://abc', project);

        expect(result.current.state.uneditableLink).toBe('');
        expect(result.current.state.selectedContentId).toBe('abc');
        expect(fetchContentById).toHaveBeenCalledWith('abc', 'a');

        act(() => result.current.setActiveTab('content'));
        expect(result.current.canSubmit).toBe(false);
    });
});

describe('link URL input integration', () => {
    it.each(['https://', 'http://', 'ftp://', 'tel:', ''] as UrlProtocol[])(
        'shows %s in the selector without touching the empty address',
        (protocol) => {
            const { result, input } = openDialog();
            act(() => result.current.setUrlProtocol(protocol));
            expect(screen.getByRole('combobox').textContent).toBe(protocol || 'Relative');
            expect(input.value).toBe('');
            expect(result.current.validationErrors).toEqual({});
            expect(result.current.canSubmit).toBe(false);
        },
    );

    it('keeps typed prefixes visible and updates them when the selected protocol changes', () => {
        const { result, input, url, nativeProtocol, click } = openDialog();
        fireEvent.input(input, { target: { value: 'https://example.com' }, inputType: 'insertText' });
        expect(input.value).toBe('https://example.com');
        act(() => result.current.setUrlProtocol('http://'));
        expect(input.value).toBe('http://example.com');
        expect(screen.getByRole('combobox').textContent).toBe('http://');
        act(() => result.current.submit());
        expect(nativeProtocol.setValue).toHaveBeenCalledWith('', false);
        expect(url.setValue).toHaveBeenCalledWith('http://example.com', false);
        expect(click).toHaveBeenCalledOnce();
    });

    it('routes a paste event through normalization and submits only the last protocol', () => {
        const { result, input, url } = openDialog();
        fireEvent.input(input, { target: { value: 'https://old.example' }, inputType: 'insertText' });
        fireEvent.input(input, { target: { value: 'HTTP://tel:90043146' }, inputType: 'insertFromPaste' });
        expect(input.value).toBe('90043146');
        expect(screen.getByRole('combobox').textContent).toBe('tel:');
        expect(result.current.canSubmit).toBe(true);
        act(() => result.current.submit());
        expect(url.setValue).toHaveBeenCalledWith('tel:90043146', false);
    });

    it.each([
        ['http://', 'tel:8080'],
        ['https://', 'localhost:8080'],
        ['ftp://', 'tel:secret@example.com/file'],
    ] as [UrlProtocol, string][])('preserves an opened %s%s link while editing its address', (protocol, address) => {
        const { result, input, url } = openDialog(protocol, address);
        expect(input.value).toBe(address);
        fireEvent.input(input, { target: { value: address + '/next' }, inputType: 'insertText' });
        expect(result.current.state.urlProtocol).toBe(protocol);
        expect(result.current.canSubmit).toBe(true);
        act(() => result.current.submit());
        expect(url.setValue).toHaveBeenCalledWith(protocol + address + '/next', false);
    });

    it('shows required validation after typing and clearing, but not from initial protocol selection', () => {
        const { result, input, click } = openDialog();
        act(() => result.current.setUrlProtocol('tel:'));
        expect(result.current.validationErrors).toEqual({});
        fireEvent.input(input, { target: { value: 'tel:123' }, inputType: 'insertText' });
        fireEvent.input(input, { target: { value: '' }, inputType: 'deleteContentBackward' });
        act(() => result.current.setUrlProtocol('http://'));
        expect(result.current.validationErrors.url).toBe('field.value.required');
        act(() => result.current.submit());
        expect(click).not.toHaveBeenCalled();
    });

    it('validates an existing address when switching to an incompatible protocol', () => {
        const { result } = openDialog('https://', 'example.com');
        act(() => result.current.setUrlProtocol('tel:'));
        expect(result.current.validationErrors.url).toBe('field.value.invalid');
        expect(result.current.canSubmit).toBe(false);
    });

    it.each(['https://', 'http://ftp://tel:'])('rejects a pasted protocol-only value: %s', (raw) => {
        const { result, input, click } = openDialog();
        fireEvent.input(input, { target: { value: raw }, inputType: 'insertFromPaste' });
        expect(input.value).toBe('');
        expect(result.current.validationErrors.url).toBe('field.value.required');
        act(() => result.current.submit());
        expect(click).not.toHaveBeenCalled();
    });

    it.each(['/path', './a:b', '..', 'file.min.js', '/admin:extension/preview:media?type=media%3Aimage#part'])(
        'validates and submits the relative address %s unchanged',
        (address) => {
            const { result, input, url } = openDialog();
            act(() => result.current.setUrlProtocol(''));
            fireEvent.input(input, { target: { value: address }, inputType: 'insertFromPaste' });
            expect(screen.getByRole('combobox').textContent).toBe('Relative');
            expect(result.current.canSubmit).toBe(true);
            act(() => result.current.submit());
            expect(url.setValue).toHaveBeenCalledWith(address, false);
        },
    );
});
