/**
 * Created on 02.12.2017.
 */

module.exports = Object.freeze({
    FORM_VIEW: `//div[contains(@id,'FormView')]`,
    CONTENT_SELECTOR: "//div[contains(@id,'ContentSelector')]",
    NAMES_VIEW_BY_NAME: "//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'%s')]]",
    NAMES_VIEW_BY_DISPLAY_NAME: "//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'%s')]]",
    SLICK_VIEW_PORT: `//div[@class='slick-viewport']`,
    SLICK_ROW: "//div[@class='slick-viewport']//div[contains(@class,'slick-row')]",
    SLICK_ROW_BY_NAME: "//div[@class='slick-viewport']//div[contains(@class,'slick-row') and descendant::p[contains(@class,'sub-name') and contains(.,'%s')]]",
    SLICK_ROW_BY_DISPLAY_NAME: "//div[@class='slick-viewport']//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'%s')]]",
    H6_DISPLAY_NAME: "//div[contains(@id,'NamesView')]//h6[contains(@class,'main-name')]",
    P_SUB_NAME: "//p[contains(@class,'sub-name')]",
    TEXT_INPUT: "//input[contains(@id,'TextInput')]",
    TEXT_AREA: "//textarea[contains(@id,'TextArea')]",
    DROP_DOWN_HANDLE: "//button[contains(@id,'DropdownHandle')]",
    GRID_CANVAS: `//div[@class='grid-canvas']`,
    TEXT_INPUT: `//input[@type='text']`,
    DROPDOWN_OPTION_FILTER_INPUT: "//input[contains(@id,'DropdownOptionFilterInput')]",
    VALIDATION_RECORDING_VIEWER: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    tabBarItemByName: function (name) {
        return `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']] `
    },
    slickRowByDisplayName: function (container, displayName) {
        return container +
               `//div[@class='slick-viewport']//div[contains(@class,'slick-row') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`;
    },
    itemByDisplayName: function (displayName) {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    itemByName: function (name) {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'xp-admin-common-sub-name') and contains(.,'${name}')]]`
    },
    CANCEL_BUTTON_TOP: `//div[@class='cancel-button-top']`,
    COMBO_BOX_OPTION_FILTER_INPUT: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
    PRINCIPAL_SELECTED_OPTION: `//div[contains(@id,'security.PrincipalSelectedOptionView')]`,
    REMOVE_ICON: `//a[@class='remove']`,
    INCLUDE_CHILDREN_TOGGLER: `//div[contains(@id,'IncludeChildrenToggler')]`,
});