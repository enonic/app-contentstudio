/**
 * Created on 14.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertLinkDialog = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.cke');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');

describe('Text Component with CKE - insert download-link specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEST_CONTENT_DISPLAY_NAME = 'server';
    const TEST_CONTENT_NAME = 'server.sh';
    const CONTROLLER_NAME = 'main region';
    const EXPECTED_SRC = '<p><a href="media://download/';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: *.sh file should be moved to the site`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            await studioUtils.findAndSelectItem(TEST_CONTENT_NAME);
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            await moveContentDialog.typeTextAndClickOnOption(SITE.displayName);
            await moveContentDialog.clickOnMoveButton();
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'download-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            // 3. Insert text component:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            //Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open Insert Link dialog:
            await textComponentCke.clickOnInsertLinkButton();
            // 5. Type a link-name and select a target:
            await insertLinkDialog.typeInLinkTextInput('test');
            await insertLinkDialog.clickOnBarItem('Content');
            // 6. Select a media content in the dropdown selector - select the 'server.sh'
            await insertLinkDialogContentPanel.selectTargetInContentSelector(TEST_CONTENT_DISPLAY_NAME);
            // 7. Click on 'Download file' radio:
            await insertLinkDialogContentPanel.clickOnRadioButton(appConst.INSERT_LINK_DIALOG_TABS.DOWNLOAD_FILE);
            await studioUtils.saveScreenshot('download_link_dialog');
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.pause(700);
            await textComponentCke.switchToLiveEditFrame();
            await studioUtils.saveScreenshot('download_link_inserted');
            // 8. Verify the text in CKE: 'media://download' should be present in the htmlarea
            let actualText = await textComponentCke.getTextFromEditor();
            assert.ok(actualText.includes(EXPECTED_SRC), "Expected text should be in the text component");
            // 9. Save the changes:
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed THEN download-link should be present in the page`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the site and click on Preview button
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            // 2. Verify that new added link is present
            let isDisplayed = await studioUtils.isElementDisplayed(`a=test`);
            await studioUtils.saveScreenshot('download_link_present');
            assert.ok(isDisplayed, 'download link should be present on the page');
        });

    it(`GIVEN Moved content is opened WHEN Versions widget has been opened THEN expected Moved version item should be present in the widget`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            // 1. open the existing moved content:
            await studioUtils.openContentAndSwitchToTabByDisplayName(TEST_CONTENT_NAME, TEST_CONTENT_DISPLAY_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 3. Click on the latest 'Moved' version item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.MOVED, 0);
            await wizardVersionsWidget.pause(500);
            await studioUtils.saveScreenshot("moved_version_item");
            // 4 'Active version' "Revert" buttons are not displayed in the 'Permission updated' item
            await wizardVersionsWidget.waitForActiveVersionButtonNotDisplayed();
            await wizardVersionsWidget.waitForRevertButtonNotDisplayed();
            // 5. Verify that 'Compare with current version' button is displayed in Moved item:
            let result = await wizardVersionsWidget.isShowChangesInVersionButtonDisplayed(appConst.VERSIONS_ITEM_HEADER.MOVED, 0);
            assert.ok(result, "'Show changes' button should be present in Moved version item ");
        });

    it(`GIVEN Moved content has been opened WHEN 'Compare Content Versions Dialog' has been opened for the latest moved item THEN left revert menu buttons should be enabled`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            // 1. open the existing moved content:
            await studioUtils.openContentAndSwitchToTabByDisplayName(TEST_CONTENT_NAME, TEST_CONTENT_DISPLAY_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 3. Open Compare versions dialog in the latest 'Moved' version item:
            await wizardVersionsWidget.clickOnShowChangesButtonByHeader(appConst.VERSIONS_ITEM_HEADER.MOVED, 0);
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("moved_version_item_compare_versions");
            // 4.Verify that left revert-menu is enabled in the dialog, because the previous version is Edited:
            await compareContentVersionsDialog.waitForLeftRevertMenuButtonEnabled();
            // 5. Verify that right revert menu is disabled, because Moved item is selected in the right selector:
            await compareContentVersionsDialog.waitForRightRevertMenuButtonDisabled()
        });

    it(`GIVEN existing child content has been selected WHEN Move button has been pressed THEN Confirmation dialog should be loaded`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Select  the content
            await studioUtils.findAndSelectItem(TEST_CONTENT_NAME);
            // 2. Move the content to another folder
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            await moveContentDialog.typeTextAndClickOnOption(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            await moveContentDialog.clickOnMoveButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await moveContentDialog.waitForClosed();
        });

    it(`GIVEN content with 2 moved version items is opened WHEN 'Compare Content Versions Dialog' has been opened for the latest moved item THEN left and right revert menu buttons should be disabled`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            // 1. open the existing moved content:
            await studioUtils.openContentAndSwitchToTabByDisplayName(TEST_CONTENT_NAME, TEST_CONTENT_DISPLAY_NAME);
            // 2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            // 3. Open Compare versions dialog in the latest 'Moved' version item:
            await wizardVersionsWidget.clickOnShowChangesButtonByHeader(appConst.VERSIONS_ITEM_HEADER.MOVED, 0);
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('moved_version_item_compare_versions_2');
            // 4.Verify that left revert-menu is enabled in the dialog, because the previous version is Moved:
            await compareContentVersionsDialog.waitForLeftRevertMenuButtonDisabled();
            // 5. Verify that right revert menu is disabled, because Moved item is selected in the right selector:
            await compareContentVersionsDialog.waitForRightRevertMenuButtonDisabled()
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.isDialogOpened().then(result => {
            if (result) {
                return insertLinkDialog.clickOnCancelButton();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
