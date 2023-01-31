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
    CONTENT_SELECTOR: "//div[contains(@id,'ContentSelector')]",
    SELECTED_LOCALE: `//div[contains(@id,'LocaleSelectedOptionView')]`,
    SLICK_VIEW_PORT: `//div[contains(@class,'slick-viewport')]`,
    SLICK_ROW: "//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row')]",
    H6_DISPLAY_NAME: "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    P_SUB_NAME: "//p[contains(@class,'sub-name')]",
    RICH_TEXT_EDITOR: `//div[contains(@id,'TextComponentView') and contains(@class,'editor-focused')]`,
    TEXT_AREA: "//textarea[contains(@id,'TextArea')]",
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    DROPDOWN_DIV: "//div[contains(@id,'Dropdown')]",
    GRID_CANVAS: `//div[contains(@class,'grid-canvas')]`,
    DIV_GRID: "//div[contains(@id,'Grid') and contains(@class,'grid no-header')]",
    SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
    TEXT_INPUT: "//input[@type='text']",
    DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    VALIDATION_RECORDING_VIEWER: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    CONTENT_SUMMARY_AND_STATUS_VIEWER: "//div[contains(@id,'ContentSummaryAndCompareStatusViewer')]",
    OPTION_SET_MENU_BUTTON: "//button[contains(@id,'MoreButton')]",
    validationRecording: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    inputView: "//div[contains(@id,'InputView')]",
    INPUT_VALIDATION_VIEW: "//div[contains(@id,'InputViewValidationViewer')]",
    OCCURRENCE_ERROR_BLOCK: "//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]",
    OCCURRENCE_VIEW: "//div[contains(@id,'InputOccurrenceView')]",
    ADD_NEW_CONTENT_BUTTON: "//button[contains(@id,'NewContentButton') and @title='Add new']",
    tabBarItemByName: function (name) {
        return `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']] `
    },
    slickRowByDisplayName: (container, displayName) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`;
    },
    actionButton: (label) => `//button[contains(@id,'ActionButton') and child::span[contains(.,'${label}')]]`,
    dialogButton: label => `//button[contains(@id,'DialogButton') and child::span[text()='${label}']]`,
    slickRowByName: (container, name) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`;
    },
    itemByDisplayName: displayName => {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    itemByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and contains(.,'${name}')]]`
    },
    projectByName: name => {
        return `//div[contains(@id,'NamesView') and descendant::span[contains(@class,'name') and contains(.,'${name}')]]`
    },
    formItemByLabel: (label) => {
        return `//div[contains(@id,'FormItem') and descendant::label[contains(.,'${label}')]]`
    },
    expanderIconByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and contains(.,'${name}')]]` +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
    EMPTY_OPTIONS_DIV: "//div[contains(@class,'empty-options') and text()='No matching items']",
    radioButtonByLabel: label => {
        return `//span[contains(@class,'radio-button') and child::label[text()='${label}']]//input`
    },
    tabMenuItem: menuName => `//li[contains(@id,'TabMenuItem') and child::a[text()='${menuName}']]`,
    TREE_GRID_CONTEXT_MENU: "//ul[contains(@id,'TreeGridContextMenu')]",
    CANCEL_BUTTON_TOP: `//div[@class='cancel-button-top']`,
    MORE_FOLD_BUTTON: "//div[contains(@id,'FoldButton') and descendant::span[text()='More']]",
    CANCEL_BUTTON_DIALOG: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
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
    ACTION_BUTTON: `//button[contains(@id,'ActionButton')]`,
    ADD_BUTTON: "//div[contains(@class,'bottom-button-row')]//button[child::span[text()='Add']]",
    SHOW_DEPENDENT_ITEM_LINK: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    VERSIONS_SHOW_CHANGES_BUTTON: `//button[contains(@id,'ActionButton') and @title='Show changes']`,
    LIVE_EDIT_FRAME: "//iframe[contains(@class,'live-edit-frame')]",
    APP_MODE_SWITCHER_TOGGLER: "//div[contains(@id,'AppWrapper')]//button[contains(@id,'ToggleIcon')]",
    SETTINGS_BUTTON: "//button[contains(@id,'WidgetButton') and @title='Settings']",
    MODE_CONTENT_BUTTON: "//button[contains(@id,'WidgetButton') and @title='Content']",
    PUBLISH_DIALOG: {
        EXCLUDE_ITEMS_IN_PROGRESS_BTN: "//button[child::span[contains(.,'Exclude items in progress')]]",
    },
    CKE: {
        insertTableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
        insertLinkButton: `//a[contains(@class,'cke_button') and contains(@title,'Link')]`,
        insertAnchorButton: `//a[contains(@class,'cke_button') and @title='Anchor']`,
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
        strikethroughButton: `//a[contains(@class,'cke_button') and contains(@title,'Strikethrough')]`,
        increaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Increase Indent')]`,
        decreaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Decrease Indent')]`,
        formatDropDownHandle: `//span[contains(@class,'cke_combo__styles') and descendant::a[@class='cke_combo_button']]`,
    },
});
