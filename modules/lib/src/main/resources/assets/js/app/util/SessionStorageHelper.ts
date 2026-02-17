import {ComponentPath} from '../page/region/ComponentPath';
import {type HtmlEditorCursorPosition} from '../inputtype/ui/text/HtmlEditorTypes';

export class SessionStorageHelper {
    public static debug: boolean = false;

    public static SELECTED_PATH_STORAGE_KEY: string = 'contentstudio:liveedit:selectedPath';

    public static SELECTED_TEXT_CURSOR_POS_STORAGE_KEY: string = 'contentstudio:liveedit:textCursorPosition';

    public static updateSelectedPathInStorage(contentId: string | undefined, value: ComponentPath | null): void {
        if (!contentId) {
            return;
        }

        if (value) {
            sessionStorage.setItem(`${SessionStorageHelper.SELECTED_PATH_STORAGE_KEY}:${contentId}`, value.toString());
        } else {
            SessionStorageHelper.removeSelectedPathInStorage(contentId);
        }
    }

    public static removeSelectedPathInStorage(contentId: string | undefined): void {
        if (!contentId) {
            return;
        }

        sessionStorage.removeItem(`${SessionStorageHelper.SELECTED_PATH_STORAGE_KEY}:${contentId}`);
    }

    public static updateSelectedTextCursorPosInStorage(contentId: string | undefined, pos: HtmlEditorCursorPosition | null): void {
        if (!contentId) {
            if (SessionStorageHelper.debug) {
                console.warn('SessionStorageHelper.updateSelectedTextCursorPosInStorage: no contentId');
            }
            return;
        }

        if (SessionStorageHelper.debug) {
            console.log('SessionStorageHelper.updateSelectedTextCursorPosInStorage: pos', pos);
        }
        if (pos) {
            sessionStorage.setItem(`${SessionStorageHelper.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`, JSON.stringify(pos));
        } else {
            SessionStorageHelper.removeSelectedTextCursorPosInStorage(contentId);
        }
    }

    public static removeSelectedTextCursorPosInStorage(contentId: string | undefined): void {
        if (!contentId) {
            if (SessionStorageHelper.debug) {
                console.warn('SessionStorageHelper.removeSelectedTextCursorPosInStorage: no contentId');
            }
            return;
        }

        if (SessionStorageHelper.debug) {
            console.log('SessionStorageHelper.removeSelectedTextCursorPosInStorage');
        }
        sessionStorage.removeItem(`${SessionStorageHelper.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`);
    }

    public static getSelectedPathFromStorage(contentId?: string): ComponentPath | null {
        if (!contentId) {
            return;
        }

        const entry: string = sessionStorage.getItem(`${SessionStorageHelper.SELECTED_PATH_STORAGE_KEY}:${contentId}`);

        return entry ? ComponentPath.fromString(entry) : null;
    }

    public static getSelectedTextCursorPosInStorage(contentId?: string): HtmlEditorCursorPosition | null {
        if (!contentId) {
            if (SessionStorageHelper.debug) {
                console.warn('SessionStorageHelper.getSelectedTextCursorPosInStorage: no contentId');
            }
            return;
        }

        const entry: string = sessionStorage.getItem(`${SessionStorageHelper.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`);
        if (SessionStorageHelper.debug) {
            console.log('SessionStorageHelper.getSelectedTextCursorPosInStorage: existing entry', entry);
        }

        return entry ? JSON.parse(entry) : null;
    }
}
