import { describe, expect, it } from 'vitest';
import { setEditorValidation } from './editorValidation';

describe('setEditorValidation', () => {
    it('describes the focused body across documents, preserving editor instructions and editable content', () => {
        const container = document.createElement('div');
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-describedby', 'editor-instructions');
        container.appendChild(iframe);
        const body = document.implementation.createHTMLDocument().body;
        body.innerHTML = '<p>Authored content</p>';
        const editor = {
            container: { $: container },
            document: { getBody: () => ({ $: body }) },
        } as unknown as CKEDITOR.editor;

        const validation = { errorId: 'field-error', label: 'Body', invalid: true, message: 'Body is required' };
        setEditorValidation(editor, validation);
        expect(iframe.getAttribute('aria-describedby')).toBe('editor-instructions field-error');
        expect(iframe.getAttribute('aria-invalid')).toBe('true');
        expect(body.getAttribute('aria-invalid')).toBe('true');
        expect(body.getAttribute('aria-label')).toBe('Body');
        expect(body.getAttribute('aria-description')).toBe('Body is required');
        expect(body.hasAttribute('aria-describedby')).toBe(false);
        expect(body.innerHTML).toBe('<p>Authored content</p>');
        setEditorValidation(editor, { ...validation, message: 'Body is too long' });
        expect(iframe.getAttribute('aria-describedby')).toBe('editor-instructions field-error');
        expect(body.getAttribute('aria-description')).toBe('Body is too long');

        setEditorValidation(editor, { ...validation, invalid: false });
        expect(iframe.getAttribute('aria-describedby')).toBe('editor-instructions');
        expect(iframe.hasAttribute('aria-invalid')).toBe(false);
        expect(body.hasAttribute('aria-invalid')).toBe(false);
        expect(body.hasAttribute('aria-description')).toBe(false);
        expect(body.getAttribute('aria-label')).toBe('Body');
        expect(body.innerHTML).toBe('<p>Authored content</p>');
    });
});
