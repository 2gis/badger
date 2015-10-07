module.exports.launchMock = function () {

    var project = {
        "count": 1,
        "results": [{
            "id": 1,
            "name": "WEBAPI"
        }]
    };

    var testPlans = {
        "count": 1,
        "results": [{
            "id": 1,
            "name": "FIRST",
            "project": 1,
            "hidden": false,
            "owner": 2
        }]
    };

    var testPlan = {
        "id": 100,
        "name": "Barsuk",
        "project": 1,
        "hidden": true,
        "owner": 1
    };

    var launchItems = {
        "count": 3,
        "results": [{
            "id": 3,
            "test_plan": 100,
            "name": "Conclusive task",
            "type": 2
        }, {
            "id": 1,
            "test_plan": 100,
            "name": "Deploy task",
            "type": 1
        }, {
            "id": 2,
            "test_plan": 100,
            "name": "Regular task",
            "type": 0
        }]
    };

    angular.module('launchMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/100\/\?project=/).respond(testPlan);
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=100&ordering=-type&type=/).respond(launchItems);
            $httpBackend.whenPOST(/.*/, {"test_plan":"100","type":"0","name":"NEW ITEM","command":"ECHO 1","timeout":1200})
                .respond(function(){
                    return [403, {"detail": "Authentication fail"}, {}];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}