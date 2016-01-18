describe('Execute launch', function () {

    var mockModule;

    beforeEach(function(){
        mockModule = require('./launchexecute_mock.js');
        browser.addMockModule('executeMock', mockModule.executeMock);
    });

    afterEach(function(){
        browser.removeMockModule('executeMock');
    });

    it('failure reason should be shown correct (as failure reason or as test name)', function(){
        browser.get('/#/launch/2222');
        var failed = element.all(by.css('[ng-repeat="test in group"]'));
        expect(failed.count()).toBe(2);
        expect(failed.first().all(by.tagName('td')).first().getText()).toBe('FAILURE1 REASON');
        expect(failed.last().all(by.tagName('td')).first().getText()).toBe('FAILURE2 REASON');

        element(by.css('[ng-click="state = 0"]')).click();
        var passed = element.all(by.css('[ng-repeat="test in group"]'));
        expect(passed.count()).toBe(1);
        expect(passed.first().all(by.tagName('td')).first().getText()).toBe('SUITE PASSED:TEST PASSED');
    });

    it('test results navigation should work correct', function(){
        browser.get('/#/launch/2222');
        var failed = element.all(by.css('[ng-repeat="test in group"]'));
        failed.first().click();
        browser.sleep(1000);
        expect(element(by.id('TestDetailsModalLabel')).getText()).toBe('SUITE1 FAILED TEST1 FAILED');
        var modalBody = element.all(by.className('modal-body')).first();
        expect(modalBody.element(by.tagName('pre')).getText()).toBe('FAILURE1 REASON');
        element(by.css('[ng-click="nextItem()"]')).click();
        expect(element(by.id('TestDetailsModalLabel')).getText()).toBe('SUITE2 FAILED TEST2 FAILED');
        expect(modalBody.element(by.tagName('pre')).getText()).toBe('FAILURE2 REASON');
        element(by.css('[ng-click="prevItem()"]')).click();
        expect(element(by.id('TestDetailsModalLabel')).getText()).toBe('SUITE1 FAILED TEST1 FAILED');
        expect(modalBody.element(by.tagName('pre')).getText()).toBe('FAILURE1 REASON');
    });

    it('relaunch should send all environment variables in post request', function(){
        browser.get('/#/launch/2222');
        element(by.css('[go-click="/testplan/1/execute/2222"]')).click();
        expect(element.all(by.model('item.key')).count()).toBe(1);
        expect(element.all(by.model('item.value')).count()).toBe(1);
        element(by.css('[ng-click="selectAllTasks(true)"]')).click();
        element(by.css('[ng-click="execute(testPlan)"]')).click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/1');
    });

    it('pagination count should be present on page', function () {
        browser.get('/#/launch/2222');
        element(by.css('[ng-click="state = 2"]')).click();
        expect(element.all(by.repeater('test in group')).count()).toBe(12);

        var pages = element.all(by.css('[ng-click="params.page(page.number)"]'));
        expect(pages.count()).toBe(0);

        var sizes = element.all(by.css('[ng-click="params.count(count)"]'));
        expect(sizes.count()).toBe(4);

        sizes.first().click();
        expect(element.all(by.repeater('test in group')).count()).toBe(10);

        pages = element.all(by.css('[ng-click="params.page(page.number)"]'));
        expect(pages.count()).toBe(4);

        pages.get(2).click();
        expect(element.all(by.repeater('test in group')).count()).toBe(2);
    });

    it('terminate button absence on finished launches', function() {
        browser.get('/#/launch/2222');
        expect(element(by.css('[ng-click="terminateLaunchTasks(launch.id)"]')).isDisplayed()).toBe(false);
    });

});
