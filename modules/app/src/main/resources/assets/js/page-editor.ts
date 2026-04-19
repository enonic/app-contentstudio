import {initPageEditor, type ComponentPath, type PageEditorInstance} from '@enonic/page-editor';
import '@enonic/page-editor/styles.css';
import {EditorEventHandler} from './EditorEventHandler';

const handler = new EditorEventHandler();

const editor: PageEditorInstance = initPageEditor(document.body, window.parent, {
    hostDomain: `${window.location.protocol}//${window.location.host}`,
    onComponentLoadRequest: (path: ComponentPath, existing: boolean) => {
        void handler.loadComponent(editor, path, existing);
    },
});
