describe('Add new testplan test', function () {

    var addPage = require('./add_page.js');

    var mockModule,
        testPlanName = 'Barsuk';

    beforeEach(function(){
        browser.clearMockModules();
        mockModule = require('./add_mock.js');
        browser.addMockModule('addMock', mockModule.addTestplanMock);
        browser.get('/#/testplan/1/add');
    });

    afterEach(function(){
        browser.removeMockModule('addMock');
    });

    it('save-button should be disabled with empty input', function () {
        expect(addPage.saveButton.isEnabled()).toBe(false);
    });

    it('save-button should sent post request and redirect to new testplan page', function () {
        addPage.testPlanNameInput.sendKeys(testPlanName);
        expect(addPage.saveButton.isEnabled()).toBe(true);
        addPage.saveButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/100');
        expect(addPage.statisticHeader.getText()).toBe('"' + testPlanName + '" statistics');
    });
});