/**
 * Created on 02.12.2017.
 */
module.exports = Object.freeze({
    NOTIFICATION_TEXT: "//div[@class='notification-text']",
    REFRESH_BUTTON: "//button[contains(@class,'icon-loop')]",
    BUTTON_WITH_SPAN_ADD: "//button[child::span[text()='Add']]",
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    FORM_ITEM: "//div[contains(@id,'FormItem')]",
    DATE_TIME_PICKER_INPUT: "//div[contains(@id,'DateTimePicker')]//input[contains(@id,'TextInput')]",
    TIME_PICKER_INPUT: "//div[contains(@id,'TimePicker')]//input[contains(@id,'TextInput')]",
    DATE_PICKER_INPUT: "//div[contains(@id,'DatePicker') and contains(@class,'date-time-picker')]//input[contains(@id,'TextInput')]",
    CONTENT_COMBOBOX: "//div[contains(@id,'ContentComboBox')]",
    NEW_CONTENT_BUTTON: "//button[contains(@class,'new-content-button')]",
    SELECTED_LOCALE: `//div[contains(@id,'LocaleSelectedOptionView')]`,
    SLICK_VIEW_PORT: `//div[contains(@class,'slick-viewport')]`,
    SLICK_ROW: "//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row')]",
    H6_DISPLAY_NAME: "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    P_SUB_NAME: "//p[contains(@class,'sub-name')]",
    RICH_TEXT_EDITOR: `//div[contains(@id,'TextComponentView') and contains(@class,'editor-focused')]`,
    TEXT_AREA: "//textarea[contains(@id,'TextArea')]",
    WIDGET_SELECTOR_DROPDOWN: `//div[contains(@id,'WidgetSelectorDropdown')]`,
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    GRID_CANVAS: `//div[contains(@class,'grid-canvas')]`,
    DIV_GRID: "//div[contains(@id,'Grid') and contains(@class,'grid no-header')]",
    SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
    TEXT_INPUT: "//input[@type='text']",
    DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    OPTION_FILTER_INPUT: "//input[contains(@id,'OptionFilterInput') and contains(@class, 'option-filter-input')]",
    VALIDATION_RECORDING_VIEWER: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    CONTENT_SUMMARY_AND_STATUS_VIEWER: "//div[contains(@id,'ContentSummaryAndCompareStatusViewer')]",
    validationRecording: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    INPUT_VALIDATION_VIEW: "//div[contains(@id,'InputViewValidationViewer')]",
    OCCURRENCE_ERROR_BLOCK: "//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]",
    OCCURRENCE_VIEW: "//div[contains(@id,'InputOccurrenceView')]",
    ADD_NEW_CONTENT_BUTTON: "//button[contains(@id,'NewContentButton')]",
    EDIT_ICON: "//a[@class='edit']",
    CONTENT_SELECTOR: {
        DIV: "//div[contains(@id,'ContentSelector')]",
        selectedOptionByName: option => {
            return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
        }
    },
    FORM_VIEW_PANEL: {
        INPUT_VIEW: "//div[contains(@id,'InputView')]",
        HTML_AREA_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'HtmlArea')]]",
        TEXT_LINE_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'TextLine')]]",
        COMBOBOX_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'ComboBox')]]",
    },
    COMBOBOX: {
        MODE_TOGGLER_BUTTON: "//button[contains(@id,'ModeTogglerButton')]",
        APPLY_SELECTION_BUTTON:"//button[contains(@class,'apply-selection-button')]",
    },
    INPUTS: {
        TEXT_INPUT: "//input[@type='text']",
        CHECKBOX_INPUT: "//input[@type='checkbox']",
        DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    },
    DIV: {
        FRAGMENT_DROPDOWN_DIV: `//div[contains(@id,'FragmentDropdown')]`,
        CHECKBOX_DIV: "//div[contains(@id,'Checkbox')]",
        DROPDOWN_DIV: "//div[contains(@id,'Dropdown')]",
        NOTIFICATION_ACTIONS_DIV: "//div[@class='notification-actions']",
        CONTENT_APP_BAR_DIV: "//div[contains(@id,'ContentAppBar')]",
        PROJECT_VIEWER_DIV: "//div[contains(@id,'ProjectViewer')]",
    },
    BUTTONS: {
        BUTTON_WITH_SPAN_ADD: "//button[child::span[text()='Add']]",
        NEW_CONTENT_BUTTON: "//button[contains(@class,'new-content-button')]",
        REFRESH_BUTTON: "//button[contains(@class,'icon-loop')]",
        DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
        SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
        SELECTOR_MODE_TOGGLER: "//button[contains(@id,'ModeTogglerButton')]",
        UPLOAD_BUTTON: "//button[contains(@class,'upload-button')]",
        actionButton: (label) => `//button[contains(@id,'ActionButton') and child::span[contains(.,'${label}')]]`,
        button: (label, cssValue) => `//button[contains(@class,'${cssValue}') and child::span[contains(.,'${label}')]]`,
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
    },
    CONTENT_SELECTOR: {
        DIV: "//div[contains(@id,'ContentSelector')]",
        selectedOptionByName: option => {
            return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
        }
    },
    FORM_VIEW_PANEL: {
        INPUT_VIEW: "//div[contains(@id,'InputView')]",
        HTML_AREA_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'HtmlArea')]]",
        TEXT_LINE_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'TextLine')]]",
        COMBOBOX_INPUT: "//div[contains(@id,'InputView') and descendant::div[contains(@id,'ComboBox')]]",
    },
    DROPDOWN_SELECTOR: {
        contentListElementByDisplayName: (container, displayName) => {
            return container +
                   `//li[contains(@id,'ContentListElement') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`;
        },
        // non-clickable li element in options dropdown list, it is for checking read-only status
        contentListElementByName: (container, name) => {
            return container +
                   `//li[contains(@id,'ContentListElement') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`;
        },
        // clickable option in dropdown options list
        dropdownListItemByDisplayName: (container, displayName) => {
            return container +
                   `//li[contains(@class,'item-view-wrapper')]//h6[contains(@class,'main-name') and contains(.,'${displayName}')]`;
        },
        dropdownListItemByName: (container, name) => {
            return container +
                   `//li[contains(@class,'item-view-wrapper')]//p[contains(@class,'sub-name') and contains(.,'${name}')]`;
        },
        flatModeDropdownImgItemByDisplayName: (container, displayName) => {
            return container +
                   `//li[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]//img`;
        },
        IMG_DROPDOWN_OPT_DISPLAY_NAME_FLAT_MODE: "//li[contains(@class,'item-view-wrapper')]" +
                                                 "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
        OPTIONS_LI_ELEMENT: "//li[contains(@id,'ContentListElement')]",
        DROPDOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
        OPTION_FILTER_INPUT: "//input[contains(@id,'OptionFilterInput') and contains(@class, 'option-filter-input')]",
        MODE_TOGGLER_BUTTON: "//button[contains(@id,'ModeTogglerButton')]",
        APPLY_SELECTION_BUTTON: "//button[contains(@class,'apply-selection-button')]",
        CONTENT_TREE_SELECTOR: "//div[contains(@id,'ContentTreeSelectorDropdown')]",
        CONTENTS_TREE_LIST_UL: "//ul[contains(@id,'ContentsTreeList')]",
    },

    DEPENDANTS: {
        EDIT_ENTRY: "//div[contains(@id,'DialogStateEntry') and contains(@class,'edit-entry')]",
        DEPENDANTS_BLOCK: "//div[contains(@class, 'dependants') and descendant::span[contains(@class,'dependants-title') and text()='Dependencies']]",
        DEPENDENT_ITEM_LIST_UL: "//ul[contains(@id,'DialogDependantItemsList')]",
        DEPENDENT_ITEM_LIST_UL_2: "//ul[contains(@id,'PublishDialogDependantList')]",
        DEPENDANT_ITEM_VIEWER: "//div[contains(@id,'DependantItemViewer')]",
        DEPENDANT_ITEM_LIST_UNPUBLISH_DIALOG: "//ul[contains(@id,'DialogWithRefsDependantList')]",
    },
    tabBarItemByName: name => {
        return `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']] `
    },
    slickRowByDisplayName: (container, displayName) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`;
    },

    TREE_GRID: {

        itemByName: name => {
            return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and contains(.,'${name}')]]`
        },
        contentStatusByDisplayName: (parent, displayName) => {
            return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(text(),'${displayName}')]]`
        },
        contentStatusByName: displayName => {
            return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::p[contains(@class,'sub-name') and contains(text(),'${displayName}')]]`
        },
        itemTreeGridListElementByDisplayName: displayName => {//ContentTreeGridListViewer
            return `//li[contains(@id,'ContentsTreeGridListElement') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
        },
        itemTreeGridListElementByName: name => {//ContentTreeGridListViewer
            return `//li[contains(@id,'ContentsTreeGridListElement') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
        },
    },
    checkBoxDiv: label => `//div[contains(@id,'Checkbox') and child::label[contains(.,'${label}')]]`,
    actionButton: (label) => `//button[contains(@id,'ActionButton') and child::span[contains(.,'${label}')]]`,
    actionButtonStrict: (label) => `//button[contains(@id,'ActionButton') and child::span[text()='${label}']]`,
    dialogButton: label => `//button[contains(@id,'DialogButton') and child::span[contains(.,'${label}')]]`,
    dialogButtonStrict: label => `//button[contains(@id,'DialogButton') and child::span[text()='${label}']]`,
    togglerButton: (label) => `//button[contains(@id,'TogglerButton') and child::span[text()='${label}']]`,
    slickRowByName: (container, name) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`;
    },
    itemByDisplayName: displayName => {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    itemStrictByDisplayName: displayName => {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
    itemByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and contains(.,'${name}')]]`
    },
    itemStrictByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and text()='${name}']]`
    },
    // TODO remove slick-row
    checkboxByName: name => {
        return `${this.itemByName(name)}` +
               `//ancestor::div[contains(@class,'slick-row')]//div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    formItemByLabel: (label) => {
        return `//div[contains(@id,'FormItem') and descendant::label[contains(.,'${label}')]]`
    },

    EMPTY_OPTIONS_DIV: "//div[contains(@class,'empty-options') and text()='No matching items']",
    radioButtonByLabel: label => {
        return `//span[contains(@class,'radio-button') and child::label[text()='${label}']]//input`
    },
    tabMenuItem: menuName => `//li[contains(@id,'TabMenuItem') and child::a[text()='${menuName}']]`,
    TREE_GRID_CONTEXT_MENU: "//ul[contains(@id,'TreeGridContextMenu')]",
    SELECTOR_MODE_TOGGLER: "//button[contains(@id,'ModeTogglerButton')]",
    CANCEL_BUTTON_TOP: "//div[@class='cancel-button-top']",
    UPLOAD_BUTTON: "//button[contains(@class,'upload-button')]",
    MORE_FOLD_BUTTON: "//div[contains(@id,'FoldButton') and descendant::span[text()='More']]",
    COMBO_BOX_OPTION_FILTER_INPUT: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
    CONTENT_WIZARD_STEP_FORM: "//div[contains(@id,'ContentWizardStepForm')]",
    BASE_SELECTED_OPTION: "//div[contains(@id,'BaseSelectedOptionView')]",
    PRINCIPAL_SELECTED_OPTIONS: `//div[contains(@id,'PrincipalSelectedOptionsView')]`,
    PRINCIPAL_SELECTED_OPTION: `//div[contains(@id,'PrincipalSelectedOptionView')]`,
    PRINCIPAL_COMBOBOX: "//div[contains(@id,'PrincipalComboBox')]",
    REMOVE_ICON: "//a[@class='remove']",
    REMOVE_BUTTON: "//a[@class='remove-button']",
    REMOVE_BUTTON_2: "//button[contains(@class,'remove-button')]",
    INCLUDE_CHILDREN_TOGGLER: "//div[contains(@id,'IncludeChildrenToggler')]",
    VERSION_HISTORY_MENU_OPTION: `//div[text()='Version history']`,
    DEPENDENCIES_MENU_OPTION: `//div[text()='Dependencies']`,
    DETAILS_MENU_OPTION: `//div[text()='Details']`,
    CHECKBOX_INPUT: "//input[@type='checkbox']",
    CONTENT_SELECTED_OPTION_VIEW: "//div[contains(@id,'ContentSelectedOptionView')]",
    DETAILS_PANEL_TOGGLE_BUTTON: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,
    SHOW_CONTEXT_PANEL_BUTTON: "//button[contains(@id,'NonMobileContextPanelToggleButton') and @title='Show Context Panel']",
    SHOW_DEPENDENT_ITEM_LINK: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    VERSIONS_SHOW_CHANGES_BUTTON: `//button[contains(@id,'ActionButton') and @title='Show changes']`,
    LIVE_EDIT_FRAME: "//iframe[contains(@class,'live-edit-frame')]",
    APP_MODE_SWITCHER_TOGGLER: "//div[contains(@id,'AppWrapper')]//button[contains(@id,'ToggleIcon')]",
    SETTINGS_BUTTON: "//button[contains(@id,'WidgetButton') and child::span[text()='Settings']]",
    MODE_CONTENT_BUTTON: "//button[contains(@id,'WidgetButton') and @title='Content']",

    PUBLISH_DIALOG: {
        EXCLUDE_BTN: "//button[child::span[contains(.,'Exclude')]]",
    },
    CKE: {
        TEXTAREA_DIV: "//div[contains(@id,'cke_TextArea')]",
        insertTableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
        insertLinkButton: `//a[contains(@class,'cke_button') and contains(@title,'Link')]`,
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
    },
    PROJECTS: {
        projectByName: name => {
            return `//div[contains(@id,'ProjectItemViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`
        },
        projectByIdentifier: id => {
            return `//div[contains(@id,'NamesView') and descendant::p[contains(@class,'sub-name') and contains(.,'${id}')]]`
        },
        selectedProjectView: displayName => `//div[contains(@id,'ProjectApplicationSelectedOptionView') and descendant::h6[text()='${displayName}']]`,
    }
});
