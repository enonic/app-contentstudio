/**
 * Created on 05.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const StatusWidget = require('../page_objects/browsepanel/detailspanel/status.widget.itemview');
const WidgetItemView = require('../page_objects/browsepanel/detailspanel/content.widget.item.view');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const SettingsForm = require('../page_objects/wizardpanel/settings.wizard.step.form');
const BrowseDetailsPanel = require('../page_objects/browsepanel/detailspanel/browse.details.panel');
const PublishContentDialog = require('../page_objects/content.publish.dialog');

describe('Browse panel, properties widget, language spec`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    it(`GIVEN existing folder(English (en)) WHEN the folder has been selected THEN expected language should be displayed in Properties Widget`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName, null, 'English (en)');
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            //1.Select existing folder(En)
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot("details_panel_language_en");
            let propertiesWidget = new PropertiesWidget();
            //2. Verify that expected language should be displayed in Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', "expected language should be present in the widget");
            //3. Application should be 'base':
            let application = await propertiesWidget.getApplication();
            assert.equal(application, "base", "Portal application should be displayed");
            //4. Verify the type:
            let type = await propertiesWidget.getType();
            assert.equal(type, "folder", "folder type should be displayed");
            //4. Modified date should be displayed:
            await propertiesWidget.waitForModifiedDateDisplayed();

            let statusWidget = new StatusWidget();
            await statusWidget.waitForStatusDisplayed("NEW");
        });

    it(`WHEN existing folder has been published THEN 'First Published' date gets visible in in Properties Widget`,
        async () => {
            let propertiesWidget = new PropertiesWidget();
            let contentBrowsePanel = new ContentBrowsePanel();
            let publishContentDialog = new PublishContentDialog();
            //1. Select and publish the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot("prop_widget_content_published");
            //2. 'First Published' date gets visible in the widget:
            await propertiesWidget.waitForFirstPublishedDateDisplayed();

            let statusWidget = new StatusWidget();
            await statusWidget.waitForStatusDisplayed("PUBLISHED");
        });

    it(`WHEN existing image is selected THEN expected properties should be displayed in the Properties Widget`,
        async () => {
            let propertiesWidget = new PropertiesWidget();
            //1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            await studioUtils.saveScreenshot("details_panel_media_content");
            //2. Application should be 'media'
            let application = await propertiesWidget.getApplication();
            assert.equal(application, "media", "media application should be displayed");
            //3. Type should be 'image'
            let type = await propertiesWidget.getType();
            assert.equal(type, "image", "image type should be displayed");
        });

    it(`GIVEN existing folder is selected WHEN 'Hide Context Panel' button has been clicked THEN Context panel should be hidden`,
        async () => {
            let browseDetailsPanel = new BrowseDetailsPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //1. Click on Hide Context Panel button:
            await contentBrowsePanel.clickOnDetailsPanelToggleButton();
            await studioUtils.saveScreenshot("details_panel_hidden");
            //2. Verify that the panel is not visible now:
            let isVisible = await browseDetailsPanel.isPanelVisible();
            assert.isFalse(isVisible, "Details panel should be hidden");
        });

    it(`GIVEN existing folder is selected WHEN widget dropdown selector has been clicked THEN expected 3 options should be displayed in the dropdown list`,
        async () => {
            let browseDetailsPanel = new BrowseDetailsPanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await browseDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            let actualOptions = await browseDetailsPanel.getWidgetSelectorDropdownOptions();
            await studioUtils.saveScreenshot("details_panel_widget_options");
            assert.isTrue(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.DEPENDENCIES));
            assert.isTrue(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY));
            assert.isTrue(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS));
            assert.equal(actualOptions.length, 3, "Three options should be in the selector");
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
            //5. Status gets modified:
            let statusWidget = new StatusWidget();
            await statusWidget.waitForStatusDisplayed("MODIFIED");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1744
    //Context Panel should be cleared after content item is unselected
    it(`GIVEN existing folder is highlighted WHEN click on the row THEN Details Panel should be cleared`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let widgetItemView = new WidgetItemView();
            //1. Click on row and select a folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot("details_panel_folder_selected");
            let actualDisplayName = await widgetItemView.getContentName();
            assert.equal(actualDisplayName, TEST_FOLDER.displayName, "Expected displayName should be in the widget");
            //2. click on the row and unselect the folder:
            await contentBrowsePanel.clickOnRowByDisplayName(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot("details_panel_cleared_1");
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
            //2. Click on thr checkbox and unselect the row :
            await studioUtils.saveScreenshot("details_panel_cleared_2");
            await contentBrowsePanel.clickOnCheckbox(TEST_FOLDER.displayName);
            //3. Verify that Details Panel is cleared:
            await widgetItemView.waitForNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
