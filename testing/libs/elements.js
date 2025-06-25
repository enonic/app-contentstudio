const COMMON = {
    DISPLAY_NAME_INPUT: "//input[@name='displayName']",
    FOOTER_ELEMENT: `//footer`,
    NOTIFICATION_TEXT: "//div[@class='notification-wrapper']//p",
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    FORM_ITEM: "//div[contains(@id,'FormItem')]",
    TEXT_INPUT: "//input[@type='text']",
    CONTEXT_WINDOW_WIDGET_SELECTOR_ITEM: "//div[@data-component='WidgetsSelectorItem']//span",
    CONTEXT_WINDOW_TOGGLE_BUTTON: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,
    CONTENT_APP_BAR_DIV: "//div[contains(@id,'BrowseAppBarElement')]",
    SELECT_ALL_CHECKBOX_LABEL: "//label[descendant::input[@type='checkbox' and @aria-label='Select all']]",
    menuItemByText: (text) => `//div[@role,'menuitem') and text()='${text}']`,


    INPUTS: {
        CHECKBOX_INPUT: "//input[@type='checkbox']",
        CHECKBOX_INPUT_CHECKED: "//input[@type='checkbox' and @aria-checked='true']",
        TEXT: "//input[@type='text']",
        textAreaByName: (name) => `//textarea[@name='${name}']`,
        inputByAriaLabel: (ariaLabel) => `//input[@aria-label='${ariaLabel}']`,
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
    buttonByLabel: (label) => `//button[contains(@type,'button') and contains(.,'${label}')]`,
    BUTTON_MENU_POPUP:"//button[@aria-haspopup='menu']",
    buttonAriaLabel: (ariaLabel) => `//button[contains(@type,'button') and contains(@aria-label,'${ariaLabel}')]`,
    buttonStatusBar: (label) => `//button[@data-component='StatusBarEntryButton' and contains(.,'${label}')]`,
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
    TREE_LIST_ITEM_CHECKBOX_LABEL: "//div[@role='checkbox']",
    CONTENT_STATUS: "//span[contains(@data-component,'StatusBadge')]",
    SORT_DIALOG_TOGGLE: "//div[contains(@class,'sort-dialog-trigger')]",
    EXPANDER_ICON_DIV: "//div[contains(@class,'toggle icon-arrow_drop_up')]",
    listItemByDisplayName: displayName => `//div[@role='listitem' and @data-component='ContentListItemWithReference' and (descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]])]`,
    listItemByDisplayNameAndDataComponent: (dataComponent,
                                            displayName) => `//div[@role='listitem' and @data-component='${dataComponent}' and (descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]])]`,
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
    itemTreeGridListElementByName: name => {
        return `//div[contains(@role,'treeitem') and descendant::small[contains(@class,'t-subtle') and contains(.,'${name}')]]`;
    },
}
const NEW_DROPDOWN = {
    DROPDOWN_LIST_ITEM_DISPLAY_NAME: `//div[@role='option']//div[1]//span[1]`,
    CONTENT_COMBOBOX: "//div[@data-component='ContentCombobox')]",
    DROPDOWN_HANDLE: "//button[@aria-label='Toggle']",
    optionByDisplayName: (displayName) => `//div[contains(@id,'listbox-option')  and descendant::span[contains(.,'${displayName}')]]`,
    treeItemByDisplayName: (displayName) => `//div[@role='treeitem']//div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]]`,
    treeItemByName: (name) => `//div[@role='treeitem']//div[@data-component='ContentLabel' and descendant::small[contains(.,'${name}')]]`,
    LIST_BOX_DIV: "//div[contains(@role,'listbox')]",
    optionByText: (text) => `//div[contains(@role,'option')  and descendant::span[text()='${text}']]`,
};
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
    NEW_DROPDOWN,
});
