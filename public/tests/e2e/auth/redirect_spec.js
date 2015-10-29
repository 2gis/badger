describe('Login', function () {
    var loginPage = require('./auth_page.js');

    var mockModule;

    beforeEach(function () {
        mockModule = require('./redirect_mock.js');
        browser.addMockModule('redirectMock', mockModule.authMock);
        browser.get('/#/dashboard');
    });

    afterEach(function () {
        browser.removeMockModule('redirectMock');
    });

    it('should redirect to default user dashboard', function () {
        browser.get('/#/auth/login/');
        loginPage.userName.sendKeys('test_user');
        loginPage.password.sendKeys('test_user');
        loginPage.submitButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/dashboard/1/');
        expect(browser.isElementPresent(by.id('test_user'))).toBe(true);
    });

    it('use redirect on previous page', function () {
        browser.get('/#/testplan/1');
        loginPage.loginButton.click();
        loginPage.userName.sendKeys('test_user');
        loginPage.password.sendKeys('test_user');
        loginPage.submitButton.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/1');
        expect(browser.isElementPresent(by.id('test_user'))).toBe(true);
    });

});