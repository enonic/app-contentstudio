const STYLES_COMBO_NAME = 'styles';
const STYLES_PANEL_CLASS = 'cke_combopanel__styles';
const STYLES_POPUP_CLASS = 'htmlarea-styles-popup';
const PATCH_FLAG = '__htmlareaStylesComboPopupPatched';
const LOAD_FLAG = '__htmlareaStylesComboPopupLoadBound';

interface RichComboPrototype {
    createPanel?: (editor: CKEDITOR.editor) => void;
    [PATCH_FLAG]?: boolean;
}

interface RichComboConstructor {
    prototype?: RichComboPrototype;
}

interface FloatPanelWithFrame extends CKEDITOR.ui.floatPanel {
    element?: CKEDITOR.dom.element;
    onShow?: () => void;
    [PATCH_FLAG]?: boolean;
    _: {
        iframe?: {
            $?: HTMLIFrameElement;
        };
    };
}

interface PopupFrame extends HTMLIFrameElement {
    [LOAD_FLAG]?: boolean;
}

interface RichComboWithPanel extends CKEDITOR.ui.richCombo {
    name?: string;
    _: {
        panel?: FloatPanelWithFrame;
    };
}

const isStylesCombo = (combo: RichComboWithPanel): boolean => combo.name?.toLowerCase() === STYLES_COMBO_NAME;

const getStylesPopupFrame = (combo: RichComboWithPanel): PopupFrame | undefined => combo._.panel?._.iframe?.$ as PopupFrame | undefined;

const syncStylesPopupPanel = (combo: RichComboWithPanel): void => {
    combo._.panel?.element?.addClass(STYLES_PANEL_CLASS);
    combo._.panel?.element?.addClass(STYLES_POPUP_CLASS);
};

const syncStylesPopupRoot = (combo: RichComboWithPanel): boolean => {
    const iframe = getStylesPopupFrame(combo);

    try {
        const root = iframe?.contentDocument?.documentElement;

        if (!root) {
            return false;
        }

        root.classList.add(STYLES_PANEL_CLASS, STYLES_POPUP_CLASS);
        root.classList.toggle('dark', document.documentElement.classList.contains('dark'));
        return true;
    } catch {
        return false;
    }
};

const bindStylesPopupLoad = (combo: RichComboWithPanel): void => {
    const iframe = getStylesPopupFrame(combo);

    if (!iframe || iframe[LOAD_FLAG]) {
        return;
    }

    iframe.addEventListener('load', () => {
        syncStylesPopupPanel(combo);
        syncStylesPopupRoot(combo);
    }, {once: true});
    iframe[LOAD_FLAG] = true;
};

export const syncStylesComboPopupRuntimeState = (): void => {
    document.querySelectorAll('.cke_panel.cke_combopanel__Styles, .cke_panel.cke_combopanel__styles').forEach((panel) => {
        panel.classList.add(STYLES_PANEL_CLASS, STYLES_POPUP_CLASS);

        const iframe = panel.querySelector<HTMLIFrameElement>('iframe.cke_panel_frame');

        try {
            const root = iframe?.contentDocument?.documentElement;

            if (!root) {
                return;
            }

            root.classList.add(STYLES_PANEL_CLASS, STYLES_POPUP_CLASS);
            root.classList.toggle('dark', document.documentElement.classList.contains('dark'));
        } catch {
            // The popup iframe can be unavailable while CKEditor initializes the panel.
        }
    });
};

export const ensureStylesComboPopupRuntimeState = (): void => {
    const richCombo = CKEDITOR.ui.richCombo as unknown as RichComboConstructor;
    const prototype = richCombo?.prototype;

    if (!prototype?.createPanel || prototype[PATCH_FLAG]) {
        return;
    }

    const originalCreatePanel = prototype.createPanel;

    prototype.createPanel = function (editor: CKEDITOR.editor): void {
        originalCreatePanel.call(this, editor);

        const combo = this as unknown as RichComboWithPanel;

        if (!isStylesCombo(combo)) {
            return;
        }

        const panel = combo._.panel;

        if (!panel) {
            return;
        }

        if (!panel[PATCH_FLAG]) {
            const originalOnShow = panel.onShow;

            panel.onShow = (): void => {
                originalOnShow?.call(panel);
                syncStylesPopupPanel(combo);

                if (!syncStylesPopupRoot(combo)) {
                    bindStylesPopupLoad(combo);
                }
            };

            panel[PATCH_FLAG] = true;
        }

        syncStylesPopupPanel(combo);
        if (!syncStylesPopupRoot(combo)) {
            bindStylesPopupLoad(combo);
        }
    };

    prototype[PATCH_FLAG] = true;
};
