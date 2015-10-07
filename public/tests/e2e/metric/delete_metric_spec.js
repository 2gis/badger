describe('Delete metric', function () {

    var mockModule;

    beforeEach(function() {
        mockModule = require('./delete_metric_mock.js');
        browser.addMockModule('deleteMetricMock', mockModule.deleteMetricMock);
        browser.get('/#/project/1/metrics');
    });

    afterEach(function() {
        browser.removeMockModule('deleteMetricMock');
    });

    it('dialog window should appear', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        metrics.first().element(by.id('delete-metric-button')).click();
        browser.sleep(1000);
        element(by.className('modal-body')).getText().then(function(text) {
           expect(text).toBe('Are you sure you want to delete metric "NEW METRIC" and all values?');
        });
    });

    it('dialog window cancel button', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        metrics.first().element(by.id('delete-metric-button')).click();
        browser.sleep(1000);

        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.first().click();
        expect(metrics.first().element(by.id('delete-metric-button')).isEnabled()).toBe(true);
    });

    it('dialog window submit button', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        metrics.first().element(by.id('delete-metric-button')).click();
        browser.sleep(1000);
        var modalFooter = element(by.className('modal-footer'));
        var buttons = modalFooter.all(by.tagName('button'));
        expect(buttons.count()).toBe(2);
        buttons.last().click();
        metrics = element.all(by.repeater('metric in metrics'));
        expect(metrics.count()).toBe(0);
    });

});
