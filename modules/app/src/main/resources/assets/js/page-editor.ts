import {
    EditorEvent,
    EditorEvents,
    PageEditor,
    type ItemView,
} from "@enonic/page-editor";
import "@enonic/page-editor/main.css";
import {EditorEventHandler} from "./EditorEventHandler";

PageEditor.init(true);
// console.info('Page editor started in edit mode.');

const eventHandler = new EditorEventHandler();

PageEditor.on(
    EditorEvents.ComponentLoadRequest,
    (event: EditorEvent<{ view: ItemView; isExisting: boolean }>) => {
        const {view, isExisting} = event.getData();
        eventHandler.loadComponentView(view, isExisting);
    },
);
