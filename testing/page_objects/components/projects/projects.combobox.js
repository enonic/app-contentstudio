/**
 * Created on 13.02.2024
 */
const BasDropdown = require('../base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ProjectsSelector')]",
};

// Parent Step wizard - select a project in the dropdown selector
class ProjectsComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredByIdAndClickOnOk(projectId, parentElement) {
        try {
            await this.clickOnFilteredByNameItemAndClickOnOk(projectId, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Projects Selector selector, screenshot: ' + screenshot + ' ' + err);
        }
    }
    async selectFilteredByDisplayNameAndClickOnOk(displayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Project Selector selector, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ProjectsComboBox;
