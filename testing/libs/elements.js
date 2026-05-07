const COMMON = {
    SHADOW_SELECTORS:{
        XP_MENU_BUTTON:`button#menu-button`
    },
    DISPLAY_NAME_INPUT: "//input[@name='displayName']",
    CONTENT_WIZARD_DATA_COMPONENT: "//div[@data-component='ContentWizardTabs']",
    FOOTER_ELEMENT: `//footer`,
    CSS_POINTER_EVENTS: 'pointer-events-none',
    NOTIFICATION_TEXT: "//div[@class='notification-wrapper']//p",
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    FORM_ITEM: "//div[contains(@id,'FormItem')]",
    TEXT_INPUT: "//input[@type='text']",
    CONTEXT_WINDOW_WIDGET_SELECTOR_SEARCH_INPUT: "//div[@data-component='WidgetsSelector']//input[@aria-label='Search']",
    CONTEXT_WINDOW_TOGGLE_BUTTON: `//button[@aria-label='Hide context panel' or @aria-label='Show context panel']`,
    CONTENT_APP_BAR_DIV: "//div[contains(@id,'BrowseAppBarElement')]",
    SELECT_ALL_CHECKBOX_LABEL: "//label[descendant::input[@type='checkbox' and @aria-label='Select all']]",
    menuItemByText: (text) => `//div[@role,'menuitem') and text()='${text}']`,
    WIDGET_SIDEBAR: {
        CONTAINER: "//nav[@aria-label='Sidebar']",
    },

    INPUTS: {
        CHECKBOX_INPUT: "//input[@type='checkbox']",
        FORM_RENDERER_DATA_COMPONENT:"//div[@data-component='FormRenderer']",
        DATA_COMPONENT_INPUT_FIELD:"//div[@data-component='InputField']",
        inputFieldByLabel:(label)=>`//div[@data-component='InputField' and descendant::div[@data-component='InputLabel' and contains(.,'${label}')]]`,
        OCCURRENCES_DATA_COMPONENT: "//div[@data-component='OccurrenceList']",
        VALIDATION_RECORDING:"//div[contains(@class,'text-error')]",
        CHECKBOX_INPUT_CHECKED: "//input[@type='checkbox' and @aria-checked='true']",
        TEXT: "//input[@type='text']",
        TEXTAREA: "//textarea",
        INPUT: "//input",
        DIV_BUTTON:"//div[@role='button']",
        textAreaByName: (name) => `//textarea[@name='${name}']`,
        inputByAriaLabel: (ariaLabel) => `//input[@aria-label='${ariaLabel}']`,
    },
    CKE:{
        textAreaElement:"//textarea[contains(@id,'htmlarea')]",
        TEXTAREA_DIV: "//div[contains(@id,'cke_TextArea')]",
        insertTableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
        pasteModeButton: `//a[contains(@class,'cke_button') and contains(@title,'Paste mode')]`,
        insertLinkButton: `//a[contains(@class,'cke_button') and contains(@title,'Link')]`,
        unlinkButton: `//a[contains(@class,'cke_button') and contains(@title,'Unlink')]`,
        insertAnchorButton: `//a[contains(@class,'cke_button') and @title='Anchor']`,
        findAndReplaceButton: "//a[contains(@class,'cke_button') and @title='Find and replace']",
        insertImageButton: `//a[contains(@class,'cke_button') and contains(@title,'Image')]`,
        insertMacroButton: `//a[contains(@class,'cke_button') and @title='Insert macro']`,
        insertSpecialCharacter: "//a[contains(@class,'cke_button') and @title='Insert Special Character']",
        italicButton: `//a[contains(@class,'cke_button') and contains(@title,'Italic')]`,
        boldButton: `//a[contains(@class,'cke_button') and contains(@title,'Bold')]`,
        underlineButton: `//a[contains(@class,'cke_button') and contains(@title,'Underline')]`,
        subscriptButton: `//a[contains(@class,'cke_button') and contains(@title,'Subscript')]`,
        superScriptButton: `//a[contains(@class,'cke_button') and contains(@title,'Superscript')]`,
        wrapCodeButton: `//a[contains(@class,'cke_button') and contains(@title,'Wrap code')]`,
        blockQuoteButton: `//a[contains(@class,'cke_button') and contains(@title,'Block Quote')]`,
        alignLeftButton: `//a[contains(@class,'cke_button') and contains(@title,'Align Left')]`,
        alignRightButton: `//a[contains(@class,'cke_button') and contains(@title,'Align Right')]`,
        centerButton: `//a[contains(@class,'cke_button') and contains(@title,'Center')]`,
        justifyButton: `//a[contains(@class,'cke_button') and contains(@title,'Justify')]`,
        bulletedButton: `//a[contains(@class,'cke_button') and contains(@title,'Bulleted List')]`,
        numberedButton: `//a[contains(@class,'cke_button') and contains(@title,'Numbered List')]`,
        sourceButton: `//a[contains(@class,'cke_button__sourcedialog') and @title='Source']`,
        fullScreen: `//a[contains(@class,'cke_button__fullscreen')  and @title='Fullscreen']`,
        tableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
        finAndReplaceButton: `//a[contains(@class,'cke_button') and contains(@title,'Find and replace')]`,
        strikethroughButton: `//a[contains(@class,'cke_button') and contains(@title,'Strikethrough')]`,
        increaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Increase Indent')]`,
        decreaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Decrease Indent')]`,
        formatDropDownHandle: `//span[contains(@class,'cke_combo__styles') and descendant::a[@class='cke_combo_button']]`,
    }
};
const WIZARD = {
    DISPLAY_NAME_INPUT: "//textarea[@placeholder='Display Name']",
    RENAME_CONTENT_SPAN: "//span[contains(@title,'Click to rename the content')]",
    PATH_INPUT: "//input[@name='name']",

};
const BUTTONS = {
    BUTTON_REMOVE_ICON: "//button[@aria-label='Remove']",
    BUTTON_EDIT_ICON: "//button[@aria-label='Edit']",
    BUTTON_WITH_SPAN_ADD: "//button[child::span[text()='Add']]",
    NEW_CONTENT_BUTTON: "//button[contains(@class,'new-content-button')]",
    REFRESH_BUTTON: "//button[contains(@class,'icon-loop')]",
    SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
    SELECTOR_MODE_TOGGLER: "//button[contains(@id,'ModeTogglerButton')]",
    UPLOAD_BUTTON: "//button[contains(@class,'upload-button')]",
    buttonByLabel: (label) => `//button[@type='button' and contains(.,'${label}')]`,
    radioButtonByLabel: (label) => `//button[@role='radio' and contains(.,'${label}')]`,
    BUTTON_MENU_POPUP: "//button[@aria-haspopup='menu']",
    buttonAriaLabel: (ariaLabel) => `//button[contains(@type,'button') and contains(@aria-label,'${ariaLabel}') and not(ancestor::*[@aria-hidden='true']) and not(ancestor::*[contains(@class,'sm:hidden')])]`,
    toolbarButtonAriaLabel: (ariaLabel) => `//button[contains(@type,'button') and contains(@aria-label,'${ariaLabel}') and not(ancestor::*[@aria-hidden='true']) and not(ancestor::*[contains(@class,'sm:hidden')])]`,
    buttonStatusBar: (label) => `//button[@data-component='StatusBarEntryButton' and contains(.,'${label}')]`,
    actionButton: (label) => `//div[contains(@id,'ActionButton')]/button[contains(.,'${label}')]`,
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
    DIV_ROLE_GRID: "//div[@role='grid']",
    DIV_ROLE_ROW: "//div[@role='row']",
    TREE_LIST_DIV: "//div[contains(@id,'tree-list')]",
    TREE_LIST_ITEM_DIV: "//div[contains(@role,'listitem')]",
    CONTENT_ITEM_CONTEXT_MENU: "//div[@role='menu' and contains(@id,'content')]",
    TREE_ITEM_DIV: "//div[contains(@role,'treeitem') and descendant::small]",
    TREE_LIST_ITEM_CHECKBOX_LABEL: "//div[@role='checkbox']",
    TREE_LIST_ITEM_CHECKBOX_CHECKED: "//div[@role='checkbox' and @aria-checked='true']",
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
const DROPDOWN = {
    SELECTOR_UPLOAD_BUTTON:"//div[@data-component='SelectorUploadButton']",
    ITEM_LABEL_NAME_SPAN:"//div[@data-component='ItemLabel']//span",
    MODE_TOGGLE:"//button[@aria-label='Tree view' or @aria-label='List view']",
    DROPDOWN_LIST_ITEM_DISPLAY_NAME: `//div[@role='option']//div[1]//span[1]`,
    CONTENT_LABEL_OPTIONS_NAME: "//div[@role='treeitem']//div[@data-component='ContentLabel']/div[2]/span",
    CONTENT_LABEL_OPTIONS_NAME_FLAT_MODE: "//div[@role='treeitem' and @aria-level='0']//div[@data-component='ContentLabel']/div[2]/span",
    COMBOBOX_POPUP: "//div[@data-combobox-popup='' or @data-combobox-popup]",
    buttonComboboxByLabel: (label) => `//span[contains(.,'${label}')]/following-sibling::button[@role='combobox']`,
    CONTENT_COMBOBOX: "//div[@data-component='ContentCombobox')]",
    DROPDOWN_HANDLE: "//button[@aria-label='Toggle']",
    LISTBOX_OPTIONS_DIV: "//div[contains(@role,'listbox')]",
    imageItemView: (imageDisplayName)=>`//div[@data-component='ImageSelectorItemView' and descendant::span[contains(text(),'${imageDisplayName}')]]`,
    listboxOptionByText: (text) => `//div[contains(@role,'option')  and descendant::span[text()='${text}']]`,
    optionByDisplayName: (displayName) => `//div[contains(@id,'listbox-option')  and descendant::span[contains(.,'${displayName}')]]`,
    listItemOptionByDisplayName: (displayName) => `//div[@role='listitem'  and descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]]]`,
    treeItemByDisplayName: (displayName) => `//div[@role='treeitem']//div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]]`,
    treeItemExpanderByDisplayName: (displayName) => `//div[@role='treeitem' and descendant::span[contains(.,'${displayName}')]]//button[@aria-label='Expand']`,
    treeItemCheckboxByDisplayName: (displayName) => `//div[@role='treeitem' and descendant::span[contains(.,'${displayName}')]]//div[@role='checkbox']`,
    languageTreeItemByDisplayName: (displayName) => `//div[@role='treeitem']//div[descendant::span[contains(.,'${displayName}')]]`,
    treeItemByName: (name) => `//div[@role='treeitem']//div[@data-component='ContentLabel' and descendant::small[contains(.,'${name}')]]`,
    LIST_BOX_DIV: "//div[contains(@role,'listbox')]",
    optionByText: (text) => `//div[contains(@role,'option')  and descendant::span[text()='${text}']]`,
    dropdownSelectedOptionByName: (dataComponentValue, optionName) => {
        return `//div[@data-component='${dataComponentValue}']//span[contains(.,'${optionName}')]`;
    },
    selectedItemByDisplayName: (displayName) =>
        `//div[@data-component='SelectorSelectionItem' and descendant::span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,
    contentSelectionItemByDisplayName: (displayName) =>
        `//div[@data-component='ContentSelectionItem' and descendant::span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,
    selectorListOptionByName: (optionName) => {
        return `//div[@role='option']//span[contains(.,'${optionName}')]`;
    },
    SELECTOR_LISTBOX: "//div[contains(@role,'listbox')]",
    WIDGET_COMBOBOX: "//div[@data-component='WidgetsSelector']",
    OPTION_FILTER_INPUT: "//input[@role='combobox']",
};
const DROPDOWN_OLD = {
    HANDLE: "//button[contains(@id,'DropdownHandle')]",
    DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    OPTION_FILTER_INPUT: "//input[contains(@id,'OptionFilterInput') and contains(@class, 'option-filter-input')]",
    DROPDOWN_DIV: "//div[contains(@id,'Dropdown')]",
    DROPDOWN_LIST_ITEM: "//*[contains(@class,'item-view-wrapper')]",
    DROPDOWN_DIV_ITEM: "//div[contains(@class,'item-view-wrapper')]",
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
const ISSUE = {
    contentRowByName: displayName => `//div[@data-component='ContentRow' and (descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${displayName}')]])]`,
}
const DIALOG_ITEMS = {
    PRIMARY_DATA_COMPONENT: "//div[@data-component='SplitList.Primary']",
    SECONDARY_DATA_COMPONENT_DIV: "//div[@data-component='SplitList.Secondary']",
    INCLUDE_CHILDREN_CHECKBOX: "/following::div[contains(@id,'children') and descendant::span[contains(.,'Include children')]]//label",
    CONTENT_ROW: "//div[@data-component='ContentRow' and (not(@aria-disabled) or @aria-disabled!='true')]",
    CONTENT_REMOVE_BUTTON:"//div[@data-component='ContentRowRemoveButton' ]//button",
    mainItemRowByName: name => `//div[@data-component='ContentRow' and descendant::div[@data-component='ContentLabel' and descendant::span[contains(.,'${name}')]]]`,
    contentRowByName: displayName => `//div[@data-component='ContentRow' and (not(@aria-disabled) or @aria-disabled!='true') and (descendant::div[@data-component='ContentRowLabel' and descendant::span[contains(.,'${displayName}')]])]`,
    ITEMS_NAME_SPAN: "//div[@data-component='ContentRowLabel']//div[@data-component='ContentLabel']//div[2]//span",
    contentCheckboxInputByName: name => DIALOG_ITEMS.contentRowByName(name) +
                                        `//div[@data-component='ContentRowCheckbox']//input[@type='checkbox']`,
    contentCheckboxLabelByName: name => DIALOG_ITEMS.contentRowByName(name) + `//div[@data-component='ContentRowCheckbox']//label`,
    mainItemDivByName: name => DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.mainItemRowByName(name),
};
const SELECTION_STATUS_BAR = {
    COMPONENT_DIV: "//div[@data-component='SelectionStatusBar']",
    BUTTON_APPLY: "//button[@data-component='StatusBarEntryButton' and text()='Apply']",
    buttonByLabel: (label) => `//button[@data-component='StatusBarEntryButton' and contains(.,'${label}')]`,

};
module.exports = Object.freeze({
    COMMON,
    BUTTONS,
    LIVE_VIEW,
    WIZARD,
    TREE_GRID,
    DROPDOWN,
    ISSUE,
    DIALOG_ITEMS,
    SELECTION_STATUS_BAR
});
