/**
 * Created on 22.01.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const OptionSetForm = require('../../page_objects/wizardpanel/optionset/optionset.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.set.view');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');
const NotificationDialog = require('../../page_objects/notification.dialog');

describe("optionset.title.labels.spec: checks option set's title and labels", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let SINGLE_SELECTION_NOTE1 = "single test";
    let SINGLE_SELECTION_NOTE2 = "single test 2";
    let MULTI_SELECTION_TITLE1 = "Option 2";
    let MULTI_SELECTION_TITLE2 = "Option 1, Option 2";
    let OPTION_SET_NAME1 = contentBuilder.generateRandomName('optionset');
    let OPTION_SET_NAME = contentBuilder.generateRandomName('optionset');

    it("Preconditions: new site should be created",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/1878
    //Option Set - Incorrect radio button behavior in multi selection
    //app-contentstudio/issues/3024
    it("GIVEN wizard for new option set is opened WHEN options in multi select have been updated THEN title of 'multi select' should be updated dynamically",
        async () => {
            let contentWizard = new ContentWizard();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            await contentWizard.typeDisplayName(OPTION_SET_NAME1);
            //2. Verify tah 'Option 2' is selected bu default:
            let isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 2");
            assert.isTrue(isSelected, "Option 2 should be selected by default");
            //3. Unselect the default 'option 2:
            await multiSelectionOptionSet.clickOnOption("Option 2");
            //4. Verify that 'Option 2' is not selected
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 2");
            assert.isFalse(isSelected, "'Option 2' should not be selected after unselecting the radio");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            //5. Verify that 'Option 2' remains unselected after the saving:
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 2");
            assert.isFalse(isSelected, "'Option 2' should not be selected after the saving");
        });

    it("GIVEN radio buttons were unselected WHEN the content is opened THEN all radio buttons should be unselected",
        async () => {
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            //1. Open an existing option set content:
            let contentWizard = await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME1);
            //2. Verify that all radio buttons are unselected:
            let isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 1");
            assert.isFalse(isSelected, "'Option 1' should not be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 2");
            assert.isFalse(isSelected, "'Option 2' should not be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 3");
            assert.isFalse(isSelected, "'Option 3' should not be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 4");
            assert.isFalse(isSelected, "'Option 4' should not be selected");
            let message = await multiSelectionOptionSet.getValidationMessage();
            assert.equal(message, 'At least one option must be selected', "expected validation message should be displayed");
        });

    //Verifies:https://github.com/enonic/lib-admin-ui/issues/1738
    //Title of a single-select option-set occurrence is not updated dynamically
    it(`GIVEN wizard for new option set is opened WHEN text in name input is updated THEN title of the single select should be updated dynamically`,
        async () => {
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            //2. Select 'Option 1' :
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            //3. Verify that the title is equal to text in 'Name' input
            await singleSelectionOptionSet.typeOptionName(SINGLE_SELECTION_NOTE1);
            let title = await singleSelectionOptionSet.getSingleSelectionLabel();
            let subheader = await singleSelectionOptionSet.getSingleSelectionSubheader();
            studioUtils.saveScreenshot('item_set_confirmation_dialog');
            assert.equal(subheader, SINGLE_SELECTION_NOTE1, "Expected title should be displayed in the option set occurrence view");
            //4. Update the text in input:
            await singleSelectionOptionSet.typeOptionName(SINGLE_SELECTION_NOTE2);
            //5. Verify that subheader is updated dynamically:
            subheader = await singleSelectionOptionSet.getSingleSelectionSubheader();
            assert.equal(subheader, SINGLE_SELECTION_NOTE2, "Expected subheader should be displayed");
        });

    it(`GIVEN wizard for new option set is opened WHEN options in multi select have been updated THEN title of 'multi select' should be updated dynamically`,
        async () => {
            let contentWizard = new ContentWizard();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let optionSetForm = new OptionSetForm();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'optionset');
            await optionSetForm.selectOptionInSingleSelection("Option 1");
            await singleSelectionOptionSet.typeOptionName("test 1");
            await singleSelectionOptionSet.collapseForm();
            await contentWizard.typeDisplayName(OPTION_SET_NAME);
            //2. Verify the title of multi select:
            let title = await multiSelectionOptionSet.getMultiSelectionLabel();
            assert.equal(title, MULTI_SELECTION_TITLE1, "Expected title should be displayed in 'multi selection'");
            //3. Click on the second option:
            await multiSelectionOptionSet.clickOnOption("Option 1");
            //4. Verify that title of the multi select is updated dynamically:
            title = await multiSelectionOptionSet.getMultiSelectionLabel();
            await contentWizard.waitAndClickOnSave();
            assert.equal(title, MULTI_SELECTION_TITLE2, "Expected title should be displayed in 'multi selection'");
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Option Set content should be valid because required input are filled");
        });

    it(`WHEN existing option set is opened THEN expected options should be selected in multi selection`,
        async () => {
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open existing Option Set content:
            await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
            await singleSelectionOptionSet.collapseForm();
            //2. Verify selected checkboxes:
            let isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 1");
            assert.isTrue(isSelected, "Option 1 should be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 2");
            assert.isTrue(isSelected, "Option 2 should  be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected("Option 3");
            assert.isFalse(isSelected, "Option 3 should not be selected");
        });

    it(`GIVEN existing option set is opened WHEN 'Option 3' checkbox has been clicked THEN this content gets not valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open existing Option Set content:
            await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
            await singleSelectionOptionSet.collapseForm();
            //2. Click on Option 3 checkbox:
            await multiSelectionOptionSet.clickOnOption("Option 3");
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Option Set content should be not valid because required image is not selected");
        });

    //Verifies - https://github.com/enonic/lib-admin-ui/issues/1811
    //Option Set - subheader is not correctly displayed
    it(`GIVEN existing option set is opened WHEN 'Option 3' checkbox has been clicked THEN this content gets not valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            //1. Open existing Option Set content:
            await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
            await singleSelectionOptionSet.collapseForm();
            //2. Click on 'Option 3' checkbox:
            await multiSelectionOptionSet.clickOnOption("Option 3");
            //3. Type the test text in HtmlArea
            await htmlAreaForm.typeTextInHtmlArea("Hello World!");
            //4. Verify that the subheader is dynamically updated:
            let subheader = await multiSelectionOptionSet.getMultiSelectionSubHeader();
            assert.equal(subheader, "Hello World!", "Expected subheader should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
