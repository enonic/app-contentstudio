/**
 * Created on 29.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../../page_objects/content.duplicate.dialog');
const appConst = require('../../libs/app_const');

describe('content.duplicate.dialog.spec: Content Duplicate Dialog specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DEPENDANTS_HEADER = 'Other items that will be duplicated';

    it(`GIVEN folder(13 child items) is selected WHEN 'Duplicate...' button has been clicked THEN 'Content Duplicate Dialog' should be loaded and expected elements should be present`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            // 1. Select the folder(13 child items)
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            // 2. Open Duplicate Content dialog:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.waitForIncludeChildCheckboxDisplayed(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            let header = await contentDuplicateDialog.getDependantsHeader();
            assert.equal(header.toLowerCase(), DEPENDANTS_HEADER.toLowerCase(), 'Expected header should be displayed');
            await contentDuplicateDialog.waitForDuplicateButtonEnabled();
            await contentDuplicateDialog.waitForCloseButtonDisplayed();

            // 3. Verify the Number in 'Duplicate' button
            let totalNumber = await contentDuplicateDialog.getNumberItemsInDuplicateButton();
            assert.equal(totalNumber, '14', "Expected number in the Duplicate button should be displayed");
            // 4. Verify the main item to duplicate
            let names = await contentDuplicateDialog.getMainItemsDisplayName();
            assert.equal(names[0], appConst.TEST_FOLDER_WITH_IMAGES, `expected parent's display name should be present`);
            // 5. Verify the list of dependant items
            let dependants = await contentDuplicateDialog.getDependentsName();
            assert.equal(dependants.length, 13, '13 dependants item should be displayed');
        });

    it(`GIVEN 2 folders with children are selected WHEN 'Duplicate...' button has been clicked THEN expected display names should be present on the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            // 1. Two folders have been selected:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_2_NAME);
            // 2. Open Duplicate dialog:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await studioUtils.saveScreenshot('duplicate_dialog_2_items');
            // 3. Verify that 2 main items are displayed
            let names = await contentDuplicateDialog.getMainItemsDisplayName();
            assert.equal(names.length, 2, '2 items to duplicate should be displayed');
            assert.equal(names[0], appConst.TEST_FOLDER_WITH_IMAGES, 'expected parent\'s display name should be present');
            assert.equal(names[1], appConst.TEST_FOLDER_2_DISPLAY_NAME, 'expected parent\'s display name should be present');

            await contentDuplicateDialog.waitForDependantsHeaderDisplayed();
            // 4. Verify the dependants items:
            let dependants = await contentDuplicateDialog.getDependentsName();
            assert.equal(dependants.length, 24, '24 dependants item should be displayed');
        });

    it(`GIVEN 'Content Duplicate' dialog is opened WHEN 'exclude child' has been clicked THEN 'Show Dependent Items' should not be displayed `,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            // 1. Select the folder(12 children) :
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            // 2. Click on the checkbox and exclude child items
            await contentDuplicateDialog.clickOnIncludeChildCheckbox();
            let isDisplayed = await contentDuplicateDialog.isIncludeChildTogglerDisplayed();
            assert.ok(isDisplayed, 'Include Child toggler should be displayed');
            await studioUtils.saveScreenshot("duplicate_dialog_child_excluded");
            // 3. Verify that 'Dependant' block gets hidden:
            await contentDuplicateDialog.waitForDependantsHeaderNotDisplayed();
            let dependantItems = await contentDuplicateDialog.getDependentsName();
            assert.equal(dependantItems.length, 0, "Dependant items should be hidden");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
