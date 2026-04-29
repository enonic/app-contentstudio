/**
 * Created on 05.07.2018. updated 21.03.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const BrowseContextWindow = require('../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const PublishContentDialog = require('../page_objects/content.publish.dialog');
const ContentBrowseContextWindow = require('../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');
const DetailsWidgetInfoSection = require('../page_objects/browsepanel/detailspanel/details.widget.info.section');
const DetailsWidgetContentSection = require('../page_objects/details_panel/details.widget.content.section');
const EditSettingDialog = require('../page_objects/details_panel/edit.settings.dialog');

describe('Browse panel, properties widget, language spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    const TEST_WIDGET_TITLE = 'My first widget';

    it(`WHEN existing image has been selected THEN expected properties should be displayed in the Widget Info Section`,
        async () => {
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            await contentBrowsePanel.openContextWindow();
            await studioUtils.saveScreenshot('details_panel_media_content');
            // 2. Application should be 'media'
            let application = await detailsWidgetInfoSection.getApplication();
            assert.equal(application, 'media', 'Incorrect application for image content. Application should be media');
            let type = await detailsWidgetInfoSection.getType();
            assert.equal(type, 'image', 'Incorrect type for image content. Type should be "image"');
            let result = await detailsWidgetInfoSection.getCreatedDate();
            // 3. Check the date format:
            const match = result.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
            assert.ok(match, 'Date Time was not found in the string');
            const dateStr = match[0];
            const isoDateStr = dateStr.replace(' ', 'T');
            const date = new Date(isoDateStr);
            assert.ok(!isNaN(date.getTime()), 'The date is not valid');
        });

    it(`GIVEN existing folder(English (en)) WHEN the folder has been selected THEN expected language should be displayed in Properties Widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName, { language: appConst.LANGUAGES.EN });
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            // 1. Select the existing folder(En)
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            await studioUtils.saveScreenshot('details_panel_language_en');
            let propertiesWidget = new DetailsWidgetInfoSection();
            // 2. Verify that expected language should be displayed in Properties widget:
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', 'expected language should be present in the widget');
            // 3. Application should be 'base':
            let application = await propertiesWidget.getApplication();
            assert.equal(application, 'base', "'base' application should be displayed");
            // 4. Verify the type:
            let type = await propertiesWidget.getType();
            assert.equal(type, 'folder', 'folder type should be displayed');
            // 5. Modified date should be displayed:
            await propertiesWidget.waitForModifiedDateDisplayed();
            let contentSection = new DetailsWidgetContentSection();
            let pathText = await contentSection.getTextInPathField();
            let displayNameText = await contentSection.getTextInDisplayNameField();
            assert.equal(displayNameText, displayName, "display name in content section should be equal to the folder display name");
        });

    it(`WHEN the folder has been selected THEN expected workflow state should be displayed in DetailsWidgetContentSection`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the existing folder
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            let contentSection = new DetailsWidgetContentSection();
            let pathText = await contentSection.getTextInPathField();
            assert.equal(pathText, `/${TEST_FOLDER.displayName}`, "path in content section should be equal to the expected path");
            let displayNameText = await contentSection.getTextInDisplayNameField();
            assert.equal(displayNameText, TEST_FOLDER.displayName,
                "display name in content section should be equal to the folder display name");

            let statusActual = await contentSection.getStatusText();
            assert.equal(statusActual, 'Offline New', 'Offline New status should be displayed for the content');
            let workflow = await contentSection.getWorkflowOrValidityStatus();
            assert.equal(workflow, 'Ready for publishing', 'Ready for publishing workflow icon should be displayed for the content');

        });

    it(`WHEN the details widget status row is constrained THEN 'Ready for publishing' should wrap to the next line`,
        async () => {
            const contentBrowsePanel = new ContentBrowsePanel();
            const contentSection = new DetailsWidgetContentSection();

            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();

            try {
                await contentSection.setStatusWidth(220);
                await contentSection.waitForWorkflowStatusWrapped();
                await studioUtils.saveScreenshot('details_panel_status_wrapped');

                const status = await contentSection.getStatusText();
                assert.equal(status, appConst.CONTENT_STATUS.OFFLINE_NEW, 'Offline New status should stay on the first line');

                const workflow = await contentSection.getWorkflowOrValidityStatus();
                assert.equal(workflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, 'Ready for publishing should remain visible');
                assert.equal(await contentSection.isWorkflowStatusWrapped(), true, 'Ready for publishing should wrap below the diff status');
            } finally {
                await contentSection.clearStatusWidth();
            }
        });

    it.skip(`WHEN existing folder has been published THEN 'First Published' date gets visible in Properties Widget`,
        async () => {
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            let contentBrowsePanel = new ContentBrowsePanel();
            let publishContentDialog = new PublishContentDialog();
            // 1. Select and publish the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            await contentBrowsePanel.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await publishContentDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('prop_widget_content_published');
            // 2. 'First Published' date gets visible in the widget:
            await detailsWidgetInfoSection.waitForFirstPublishedDateDisplayed();
        });

    it(`WHEN existing image is selected THEN expected properties should be displayed in the Properties Widget`,
        async () => {
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            await contentBrowsePanel.openContextWindow();
            await studioUtils.saveScreenshot('details_panel_media_content');
            // 2. Application should be 'media'
            let application = await detailsWidgetInfoSection.getApplication();
            assert.equal(application, 'media', 'media application should be displayed');
            // 3. Type should be 'image'
            let type = await detailsWidgetInfoSection.getType();
            assert.equal(type, 'image', 'image type should be displayed');
        });

    it(`GIVEN existing folder is selected WHEN 'Hide Context Panel' button has been clicked THEN Context panel should be hidden`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            // 1. Click on Hide Context Panel button:
            await contentBrowsePanel.clickOnHideContextWindowButton();
            await studioUtils.saveScreenshot('details_panel_hidden');
            // 2. Verify that the details panel is not visible now:
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            await detailsWidgetInfoSection.waitForNotDisplayed();
        });

    it(`GIVEN existing folder is selected WHEN widget dropdown selector has been clicked THEN expected 5 options should be displayed in the dropdown list`,
        async () => {
            let browseContextWindow = new BrowseContextWindow();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            // 1. Click on the dropdown handler:
            await browseContextWindow.clickOnWidgetSelectorDropdownHandle();
            let actualOptions = await browseContextWindow.getWidgetSelectorDropdownOptions();
            await studioUtils.saveScreenshot('details_panel_widget_options');
            // 2. Verify the options:
            assert.ok(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.DEPENDENCIES), 'Dependencies option should be displayed');
            assert.ok(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY),
                `'Version history' option should be displayed`);
            assert.ok(actualOptions.includes(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS), `'Details' option should be displayed`);
            assert.equal(actualOptions.length, 5, 'Five options should be in the selector');
        });

    it(`GIVEN existing folder is opened WHEN tried to deselect the single selected item THEN the same widgets are displayed after clicking on the selected option in the list`,
        async () => {
            let wizardContextWindow = new WizardContextPanel();
            let contentWizard = new ContentWizard();
            let propertiesWidgetItem = new DetailsWidgetInfoSection();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 1. Click on the dropdown handler, expand the list of options and try to deselect the single selected item
            await wizardContextWindow.clickOnWidgetSelectorDropdownOption(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            // 2. Verify that 'Edit Settings' button remains visible in the context window:
            await propertiesWidgetItem.waitForEditSettingsButtonDisplayed();
        });

    it("GIVEN existing folder is selected WHEN custom widget item has been selected in widget-selector THEN expected text gets visible in the widget-view",
        async () => {
            let contentBrowseContextWindow = new ContentBrowseContextWindow();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            await contentBrowseContextWindow.waitForWidgetSelected(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            // 1. Select the custom widget in the dropdown selector:
            await contentBrowseContextWindow.selectItemInWidgetSelector(TEST_WIDGET_TITLE);
            await studioUtils.saveScreenshot('test_widget_opened');
            // 2. Verify that expected text is displayed in the widget view:
            let result = await studioUtils.getTextFromShadow('context-panel-extension', 'widget');
            assert.equal(result, TEST_WIDGET_TITLE, 'Expected text should be displayed in the widget');
        });

    it.skip(`GIVEN existing folder with language is opened WHEN the language has been removed in 'Edit Settings Dialog' THEN language should not be displayed in the widget`,
        async () => {
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            let contentWizard = new ContentWizard();
            // 1. Open the folder:
            await studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open 'Edit Settings' modal dialog:
            await contentWizard.openContextWindow();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 3. Remove the language:
            await editSettingsDialog.clickOnRemoveLanguage();
            await editSettingsDialog.clickOnApplyButton();
            await editSettingsDialog.waitForNotificationMessage();
            // Go to browse panel
            await studioUtils.doSwitchToContentBrowsePanel();
            // 4. Open browse details panel:
            await studioUtils.openBrowseDetailsPanel();
            // 5. Language should not be present in the widget now :
            await studioUtils.saveScreenshot('details_panel_language_removed');
            await detailsWidgetInfoSection.waitForLanguageNotVisible();
            // 6. Status remains Online, due to metadata update:
            let detailsWidgetContentSection = new DetailsWidgetContentSection();
            let status = await detailsWidgetContentSection.getStatusText();
            assert.equal(status, 'Online', 'Status should be Online after language removed');
        });

    it(`GIVEN existing folder is highlighted WHEN click on the row THEN Details Panel should be cleared`,
        async () => {
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Click on row and select a folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openContextWindow();
            await studioUtils.saveScreenshot('details_panel_folder_selected');
            let actualType = await detailsWidgetInfoSection.getType();
            assert.equal(actualType, 'folder', 'Expected DetailsWidgetInfoSection should be displayed');
            await contentBrowsePanel.clickOnRowByName(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('details_panel_cleared_1');
            // 4. Verify that Details Panel is cleared:
            await detailsWidgetInfoSection.waitForNotDisplayed();
        });

    // TODO remove skip
    it.skip(`GIVEN existing folder is checked WHEN uncheck the row THEN Details Panel should be cleared`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
            // 1. Click on the checkbox and select the row:
            await studioUtils.typeNameInFilterPanel(TEST_FOLDER.displayName);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(TEST_FOLDER.displayName);
            let actualType = await detailsWidgetInfoSection.getType();
            assert.equal(actualType, 'folder', 'Expected DetailsWidgetInfoSection should be displayed');
            // 2. Click on the checkbox and uncheck the row :
            await contentBrowsePanel.clickOnCheckboxByName(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('details_panel_cleared_2');
            // 3. Verify that Details Panel is cleared:
            await detailsWidgetInfoSection.waitForNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
