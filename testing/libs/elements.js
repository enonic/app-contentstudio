const COMMON = {
    DISPLAY_NAME_INPUT: "//input[@name='displayName']",
    NOTIFICATION_TEXT: "//div[@class='notification-wrapper']//p",
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    FORM_ITEM: "//div[contains(@id,'FormItem')]",
    TEXT_INPUT: "//input[@type='text']",
    CONTEXT_WINDOW_WIDGET_SELECTOR_ITEM: "//div[@data-component='WidgetsSelectorItem']//span",
    CONTEXT_WINDOW_TOGGLE_BUTTON: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,


    INPUTS: {
        CHECKBOX_INPUT: "//input[@type='checkbox']",
        CHECKBOX_INPUT_CHECKED: "//input[@type='checkbox' and @aria-checked='true']",
        TEXT: "//input[@type='text']",
    }


};
const WIZARD = {
    DISPLAY_NAME_INPUT: "//input[@name='displayName']",
    RENAME_CONTENT_SPAN: "//span[contains(@title,'Click to rename the content')]",
    PATH_INPUT: "//input[@name='name']",

};
const BUTTONS = {
    BUTTON_WITH_SPAN_ADD: "//button[child::span[text()='Add']]",
    NEW_CONTENT_BUTTON: "//button[contains(@class,'new-content-button')]",
    REFRESH_BUTTON: "//button[contains(@class,'icon-loop')]",
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
    SELECTOR_MODE_TOGGLER: "//button[contains(@id,'ModeTogglerButton')]",
    UPLOAD_BUTTON: "//button[contains(@class,'upload-button')]",
    button: (label) => `//button[contains(@type,'button') and contains(.,'${label}')]`,
    buttonAriaLabel: (ariaLabel) => `//button[contains(@type,'button') and contains(@aria-label,'${ariaLabel}')]`,
    actionButton: (label) => `//div[contains(@id,'ActionButton')]/button[contains(.,'${label}')]`,
    actionButtonStrict: (label) => `//div[contains(@id,'ActionButton')]/button[text()='${label}']`,
    dialogButton: label => `//button[contains(@id,'DialogButton') and child::span[contains(.,'${label}')]]`,
    dialogButtonStrict: label => `//button[contains(@id,'DialogButton') and child::span[text()='${label}']]`,
    togglerButton: (label) => `//button[contains(@id,'TogglerButton') and child::span[text()='${label}']]`,
    COLLAPSE_BUTTON_BOTTOM: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  (text()='Collapse' or text()='Collapse all')]",
    COLLAPSE_ALL_BUTTON_BOTTOM: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  (text()='Collapse' or text()='Collapse all')]",
    EXPAND_BUTTON_BOTTOM: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  text()='Expand']",
    EXPAND_ALL_BUTTON_BOTTOM: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  text()='Expand all')]",
    COLLAPSE_BUTTON_TOP: "//div[contains(@class,'top-button-row')]//a[contains(@class,'collapse-button') and (text()='Collapse' or text()='Collapse all')]",
    MORE_BUTTON: "//button[contains(@id,'MoreButton')]",
    ADD_BUTTON: "//div[contains(@class,'bottom-button-row')]//button[child::span[text()='Add']]",
    BUTTON: label => `//button[contains(@type,'button') and contains(.,'${label}')]`,
};
const LIVE_VIEW = {
    EMULATOR_DROPDOWN: "//div[contains(@id,'EmulatorDropdown')]",
    DIV_DROPDOWN: "//div[contains(@id,'PreviewWidgetDropdown')]",
    PREVIEW_NOT_AVAILABLE_SPAN: "//div[@class='no-preview-message']//span[text()='Preview not available']",
    NO_PREVIEW_MSG_SPAN: "//div[@class='no-preview-message']//span",
    NO_CONTROLLER_NO_PREVIEW_MSG_SPAN: "//div[@class='no-selection-message']//span",
    EMPTY_LIVE_FRAME_DIV: "//div[contains(@class,'frame-container')]//iframe[@class='live-edit-frame']",
    LIVE_EDIT_FRAME: "//div[contains(@id,'FrameContainer')]//iframe[contains(@class,'text') or contains(@class,'application')]",
    MINIMIZE_BUTTON: `//div[contains(@class,'minimize-edit')]`,
    PAGE_EDITOR_TOGGLE_BUTTON: "//button[contains(@id, 'CycleButton')]",
    HIDE_PAGE_EDITOR_BUTTON: "//button[contains(@id,'ContentActionCycleButton') and @title='Hide Page Editor']",
};
const TREE_GRID = {
    TREE_LIST_DIV: "//div[contains(@id,'tree-list')]",
    TREE_LIST_ITEM_DIV: "//div[contains(@role,'listitem')]",
    CONTENT_ITEM_CONTEXT_MENU: "//div[@role='menu' and contains(@id,'content')]",
    TREE_ITEM_DIV: "//div[contains(@role,'treeitem') and descendant::small[contains(@class,'t-subtle')]]",
    TREE_LIST_ITEM_CHECKBOX_LABEL: "//label[descendant::input[@type='checkbox']]",
    CONTENT_STATUS: "//div[contains(@id,'StatusBlock')]/span",
    SORT_DIALOG_TOGGLE: "//div[contains(@class,'sort-dialog-trigger')]",
    EXPANDER_ICON_DIV: "//div[contains(@class,'toggle icon-arrow_drop_up')]",
    P_CONTENT_NAME: "//p[contains(@class,'sub-name')]",
    // Block that contains: name, displayName, icon...
    CONTENT_LABEL_BLOCK: "//div[@data-component='ContentLabel']",
    itemContextMenuItemByName: (name) => {
        return `//div[@role='menu' and contains(@id,'content')]//div[contains(@id,'menu-item') and contains(.,'${name}')]`;
    },
    itemByName: name => {
        return `//div[contains(@role,'treeitem') and descendant::small[contains(@class,'t-subtle') and contains(.,'${name}')]]`
    },
    itemByDisplayName: displayName => {
        return `//div[contains(@role,'treeitem') and descendant::span[contains(.,'${displayName}')]]`
    },
    contentSummaryByDisplayName: (parent, displayName) => {

    },
    contentSummaryByName: name => {

    },
    itemTreeGridListElementByDisplayName: displayName => {//ContentTreeGridListViewer

    },
    itemTreeGridListElementByName: name => {
        return `//div[contains(@role,'treeitem') and descendant::small[contains(@class,'t-subtle') and contains(.,'${name}')]]`
    },
}
const DROPDOWN = {
        HANDLE: "//button[contains(@id,'DropdownHandle')]",
        DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
        OPTION_FILTER_INPUT: "//input[contains(@id,'OptionFilterInput') and contains(@class, 'option-filter-input')]",
        DROPDOWN_DIV: "//div[contains(@id,'Dropdown')]",
        DROPDOWN_LIST_ITEM: "//*[contains(@class,'item-view-wrapper')]",
        DROPDOWN_DIV_ITEM: "//div[contains(@class,'item-view-wrapper')]",
        WIDGET_COMBOBOX: "//button[contains(@id,'WidgetsSelector') and @role='combobox']",
        SELECTOR_LISTBOX: "//div[contains(@role,'listbox')]",
        dropdownSelectedOptionByName: (dataComponentValue, optionName) => {
            return `//div[@data-component='${dataComponentValue}']//span[contains(.,'${optionName}')]`;
        },
        selectorListOptionByName: (optionName) => {
            return `//div[@role='option']//span[contains(.,'${optionName}')]`;
        },
        FILTERABLE_LISTBOX: "//div[contains(@id,'FilterableListBoxWrapper')]",
        IMAGE_CONTENT_COMBOBOX_DIV: "//div[contains(@id,'ImageContentComboBox')]",
        MODE_TOGGLER_BUTTON: "//button[contains(@id,'ModeTogglerButton')]",
        APPLY_SELECTION_BUTTON: "//button[contains(@class,'apply-selection-button')]",
        flatModeDropdownImgItemByDisplayName: (container, displayName) => {
            return container +
                   `//*[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]//img`;
        },
        IMG_DROPDOWN_OPT_DISPLAY_NAME_FLAT_MODE: "//li[contains(@class,'item-view-wrapper')]" +
                                                 "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    };
module.exports = Object.freeze({
    COMMON,
    DROPDOWN,
    BUTTONS,
    LIVE_VIEW,
    WIZARD,
    TREE_GRID,
});
