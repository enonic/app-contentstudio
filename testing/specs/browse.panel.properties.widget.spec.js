/**
 * Created on 05.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const WidgetItemView = require('../page_objects/browsepanel/detailspanel/content.widget.item.view');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const SettingsForm = require('../page_objects/wizardpanel/settings.wizard.step.form');

describe('Browse panel, properties widget, language spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    it(`GIVEN existing folder(English (en)) WHEN the folder has been selected and 'Details Panel' opened THEN expected language should be displayed in the widget`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName, null, 'English (en)');
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            await studioUtils.saveScreenshot("details_panel_language_en");
            let propertiesWidget = new PropertiesWidget();
            //Verify that expected language should be displayed in Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', "expected language should be present in the widget");
        });

    it(`GIVEN existing folder with language is opened WHEN the language has been removed and 'Details Panel' opened THEN language should not be displayed in the widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            //1. Open the folder:
            await studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName);
            let settingsForm = new SettingsForm();
            //2.remove the language:
            await settingsForm.clickOnRemoveLanguage();
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doSwitchToContentBrowsePanel();
            //3. Open browse details panel:
            await studioUtils.openBrowseDetailsPanel();
            //4. Language should not be present in the widget now :
            await studioUtils.saveScreenshot("details_panel_language_removed");
            await propertiesWidget.waitForLanguageNotVisible();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1744
    //Context Panel should be cleared after content item is unselected
    it(`GIVEN existing folder is highlighted WHEN click on the row THEN Details Panel should be cleared`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let widgetItemView = new WidgetItemView();
            //1. Click on row with the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot("details_panel_folder_selected");
            let actualDisplayName = await widgetItemView.getContentName();
            assert.equal(actualDisplayName, TEST_FOLDER.displayName, "Expected displayName should be in the widget");
            //2. Open browse details panel:
            await studioUtils.openBrowseDetailsPanel();
            //3. click on the row in the second time:
            await studioUtils.saveScreenshot("details_panel_cleared_1");
            await contentBrowsePanel.clickOnRowByDisplayName(TEST_FOLDER.displayName);
            //4. Verify that Details Panel is cleared:
            await widgetItemView.waitForNotDisplayed();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1744
    //Context Panel should be cleared after content item is unselected
    it(`GIVEN existing folder is checked WHEN uncheck the row THEN Details Panel should be cleared`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let widgetItemView = new WidgetItemView();
            //1. Click on the checkbox and select the row:
            await studioUtils.typeNameInFilterPanel(TEST_FOLDER.displayName);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(TEST_FOLDER.displayName);
            let actualDisplayName = await widgetItemView.getContentName();
            assert.equal(actualDisplayName, TEST_FOLDER.displayName, "Expected displayName should be in the widget");
            //2. Open browse details panel:
            await studioUtils.openBrowseDetailsPanel();
            //3. uncheck the row :
            await studioUtils.saveScreenshot("details_panel_cleared_2");
            await contentBrowsePanel.clickOnCheckbox(TEST_FOLDER.displayName);
            //4. Verify that Details Panel is cleared:
            await widgetItemView.waitForNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
