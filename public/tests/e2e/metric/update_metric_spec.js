describe('Update metric', function () {

    var metricPage = require('./add_metric_page.js');

    var mockModule;

    beforeEach(function() {
        mockModule = require('./update_metric_mock.js');
        browser.addMockModule('updateMetricMock', mockModule.updateMetricMock);
        browser.get('/#/project/1/metrics');
    });

    afterEach(function() {
        browser.removeMockModule('updateMetricMock');
    });

    it('page with metric should be sorted', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        expect(metrics.count()).toBe(2);
        expect(metrics.first().getText()).toBe('NEW METRIC 2');
        expect(metrics.last().getText()).toBe('NEW METRIC 1');
    });

    it('name should be changed and show success message', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        expect(metrics.count()).toBe(2);
        metric = metrics.first();
        metric.element(by.id('edit-metric-button')).click();
        metric.element(by.id('update-metric-name')).clear();
        metric.element(by.id('update-metric-name')).sendKeys('UPDATED METRIC');
        metric.element(by.id('update-metric-confirm-button')).click();
        expect(metric.element(by.id('update-form-info')).getText()).toBe('Metric updated successfully');
    });

    it('metric name should not be change on existent name', function () {
        metrics = element.all(by.repeater('metric in metrics'));
        expect(metrics.count()).toBe(2);
        metric = metrics.first();
        metric.element(by.id('edit-metric-button')).click();
        metric.element(by.id('update-metric-name')).clear();
        metric.element(by.id('update-metric-name')).sendKeys('EXISTENT METRIC');
        metric.element(by.id('update-metric-confirm-button')).click();
        expect(metric.element(by.id('update-form-errors')).getText()).toBe('Metric already exist, choose another name');
    });

});
