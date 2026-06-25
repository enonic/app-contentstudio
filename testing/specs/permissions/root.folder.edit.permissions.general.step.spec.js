/**
 * Created on 16.01.2018. updated on 04.06.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const appConst = require('../../libs/app_const');

describe('Folder in root directory, General step, edit.permissions.dialog.spec ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;
    const INITIAL_NUMBER_OF_SELECTED_ITEMS = 7;


    it(`GIVEN existing root-folder is selected WHEN 'General Step' of Edit Permissions dialog has been opened THEN expected elements should be displayed in the step`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Select the folder and open Details Panel:
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog()
            // 6. 'Restricted' radio should be displayed
            await editPermissionsGeneralStep.waitForRestrictedRadioDisplayed();
            // 4. Verify that 'Next' button is disabled
            await editPermissionsGeneralStep.waitForNextButtonDisabled();
            // 5. Verify that 'Public' radio is selected by default:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected by default`);
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonNotDisplayed();
        });

    it(`GIVEN a permission-entry has been removed in General Step WHEN 'CopyFromProjectButton' button has been pressed THEN 'Next' button gets disabled again`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            let items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS, '7 selected item should be selected by default');
            // 3. Click on remove icon:
            await editPermissionsGeneralStep.removeAclEntry(appConst.SYSTEM_ROLES_NAME.ADMINISTRATOR);
            // 4. Verify that 'Next' button is enabled, 'Reset' button is enabled as well
            await editPermissionsGeneralStep.waitForNextButtonEnabled();
            // 5. Verify that the number of selected items is reduced by one
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, 6, 'The number of selected items should be 6 after removing one item');
            // 6. Click on Copy from project button:
            await editPermissionsGeneralStep.clickOnCopyFromProjectButton();
            // 7. Verify that 'Next' button is disabled now
            await editPermissionsGeneralStep.waitForNextButtonDisabled();
            // 8. Verify that the initial number of selected items is restored:
            items = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.strictEqual(items.length, INITIAL_NUMBER_OF_SELECTED_ITEMS,
                'Initial entries should be restored after clicking on Reset button');
        });

    // Principal selector doesn't include the "Everyone" principal
    it(`GIVEN General Step of Edit Permissions dialog has been opened WHEN 'Everyone' text has been inserted in the filter input THEN 'No results found' message should appear`,
        async () => {
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            // 1. Select the folder and open Details Panel:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            // 2. Click on 'Edit Permissions' link and open the modal dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.doFilterOptionsInSelector('Everyone');
            let message = await editPermissionsGeneralStep.waitForEmptyOptionsMessage();
            assert.equal(message, 'No results found', "No results found message should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
