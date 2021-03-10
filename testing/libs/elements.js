/**
 * Created on 02.12.2017.
 */

module.exports = Object.freeze({
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    FORM_ITEM: "//div[contains(@id,'FormItem')]",
    DATE_TIME_PICKER_INPUT: "//div[contains(@id,'DateTimePicker')]//input[contains(@id,'TextInput')]",
    CONTENT_SELECTOR: "//div[contains(@id,'ContentSelector')]",
    SELECTED_LOCALE: `//div[contains(@id,'LocaleSelectedOptionView')]`,
    NAMES_VIEW_BY_NAME: "//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'%s')]]",
    NAMES_VIEW_BY_DISPLAY_NAME: "//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'%s')]]",
    SLICK_VIEW_PORT: `//div[contains(@class,'slick-viewport')]`,
    SLICK_ROW: "//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row')]",
    H6_DISPLAY_NAME: "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    P_SUB_NAME: "//p[contains(@class,'sub-name')]",
    TEXT_INPUT: "//input[contains(@id,'TextInput')]",
    RICH_TEXT_EDITOR: `//div[contains(@id,'TextComponentView') and contains(@class,'editor-focused')]//div[contains(@id,'TextComponentView')]`,
    TEXT_AREA: "//textarea[contains(@id,'TextArea')]",
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    GRID_CANVAS: `//div[contains(@class,'grid-canvas')]`,
    DIV_GRID: "//div[contains(@id,'Grid') and contains(@class,'grid no-header')]",
    SELECTION_PANEL_TOGGLER: `//button[contains(@id,'SelectionPanelToggler')]`,
    TEXT_INPUT: "//input[@type='text']",
    DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    VALIDATION_RECORDING_VIEWER: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    CONTENT_SUMMARY_AND_STATUS_VIEWER: "//div[contains(@id,'ContentSummaryAndCompareStatusViewer')]",
    OPTION_SET_MENU_BUTTON: "//button[contains(@id,'MoreButton')]",
    tabBarItemByName: function (name) {
        return `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']] `
    },
    slickRowByDisplayName: (container, displayName) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`;
    },
    slickRowByName: (container, displayName) => {
        return container +
               `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::p[contains(@class,'sub-name') and contains(.,'${displayName}')]]`;
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
    tabMenuItem: menuName => `//li[contains(@id,'TabMenuItem') and child::a[text()='${menuName}']]`,
    TREE_GRID_CONTEXT_MENU: "//ul[contains(@id,'TreeGridContextMenu')]",
    CANCEL_BUTTON_TOP: `//div[@class='cancel-button-top']`,
    CANCEL_BUTTON_DIALOG: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    COMBO_BOX_OPTION_FILTER_INPUT: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
    PRINCIPAL_SELECTED_OPTIONS: `//div[contains(@id,'PrincipalSelectedOptionsView')]`,
    PRINCIPAL_SELECTED_OPTION: `//div[contains(@id,'PrincipalSelectedOptionView')]`,
    PRINCIPAL_COMBOBOX: "//div[contains(@id,'PrincipalComboBox')]",
    REMOVE_ICON: `//a[@class='remove']`,
    REMOVE_BUTTON: `//a[@class='remove-button']`,
    INCLUDE_CHILDREN_TOGGLER: `//div[contains(@id,'IncludeChildrenToggler')]`,
    VERSION_HISTORY_MENU_OPTION: `//div[text()='Version history']`,
    DEPENDENCIES_MENU_OPTION: `//div[text()='Dependencies']`,
    DETAILS_MENU_OPTION: `//div[text()='Details']`,
    CHECKBOX_INPUT: "//input[@type='checkbox']",
    CONTENT_SELECTED_OPTION_VIEW: "//div[contains(@id,'ContentSelectedOptionView')]",
    DETAILS_PANEL_TOGGLE_BUTTON: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,
    ACTION_BUTTON: `//button[contains(@id,'ActionButton')]`,
    SHOW_DEPENDENT_ITEM_LINK: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    COMPARE_WITH_CURRENT_VERSION: `//button[contains(@id,'ActionButton') and @title='Compare with current version']`,
    LIVE_EDIT_FRAME: "//iframe[contains(@class,'live-edit-frame shown')]",
    APP_MODE_SWITCHER_TOGGLER: "//div[contains(@id,'AppWrapper')]//button[contains(@id,'ToggleIcon')]",
    SETTINGS_BUTTON: "//button[contains(@id,AppModeButton) and @title='Settings']",
    MODE_CONTENT_BUTTON: "//button[contains(@id,AppModeButton) and @title='Content']"
});
