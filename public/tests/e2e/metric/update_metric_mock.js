module.exports.updateMetricMock = function () {

    var profile = {
        id: 1,
        email: 'user@test.zone',
        username: 'user',
        is_active: true,
        is_staff: true
    };

    var project = {
        count: 1,
        results: [{
            id: 1,
            name: 'WEBAPI'
        }]
    };

    var testPlans = {
        count: 1,
        results: [{
            id: 1,
            name: 'FIRST',
            project: 1,
            hidden: false,
            owner: 2
        }]
    };

    var metric1 = {
        id: 1,
        project: 1,
        schedule: '0 0 * * *',
        weight: 2,
        name: 'NEW METRIC 1',
        query: 'NEW QUERY',
        handler: 'count'
    }
    var metric2 = {
        id: 2,
        project: 1,
        schedule: '0 0 * * *',
        weight: 1,
        name: 'NEW METRIC 2',
        query: 'NEW QUERY',
        handler: 'count'
    }

    var requestNumber = 0;

    angular.module('updateMetricMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/metrics\/\?project=1/).respond( function() {
                return [200, {count: 2, results: [metric1, metric2]}];
             });
            $httpBackend.whenPATCH(/.*/, {
                id: 2,
                project: 1,
                schedule: '0 0 * * *',
                weight: 1,
                name: 'UPDATED METRIC',
                query: 'NEW QUERY',
                handler: 'count',
                isEdit: true,
                '$edit': false })
            .respond(function () {
                return [200, metric2, {}];
            });
            $httpBackend.whenPATCH(/.*/, {
                id: 2,
                project: 1,
                schedule: '0 0 * * *',
                weight: 1,
                name: 'EXISTENT METRIC',
                query: 'NEW QUERY',
                handler: 'count',
                isEdit: true,
                '$edit': false })
            .respond(function () {
                return [400, {message: 'Metric already exist, choose another name'}, {}];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}

