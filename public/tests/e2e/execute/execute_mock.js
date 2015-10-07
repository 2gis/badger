module.exports.executeMock = function () {

    var profile = {
        "id": 1,
        "email": "user@test.zone",
        "username": "user",
        "is_active": true,
        "is_staff": true
    };

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
        "id": 1,
        "name": "FIRST",
        "project": 1,
        "main": false,
        "hidden": true,
        "owner": 2,
        "filter": ""
    };

    var launchItems = {
        "count": 2,
        "results": [{
            "id": 1,
            "test_plan": 1,
            "name": "Deploy task",
            "type": 1
        }, {
            "id": 2,
            "test_plan": 1,
            "name": "Conclusive task",
            "type": 2
        }, {
            "id": 3,
            "test_plan": 1,
            "name": "Regular task",
            "type": 0
        }]
    };

    var launches_results = {
        "id": 1,
        "test_plan": 1,
        "created": "2015-04-14T10:41:04.925Z",
        "counts": {
            "failed": 0,
            "skipped": 0,
            "total": 0,
            "passed": 0,
            "blocked": 0
        },
        "tasks": {
            "f682a443-6f71-457a-afbe-bdea55ba3f64": {
                "id": 1,
                "test_plan": 1,
                "name": "launch1",
                "type": 1
            },
            "4957b073-e65a-414e-b61a-d4d3c574d47f": {
                "id": 111,
                "test_plan": 1,
                "name": "launch2",
                "type": 0
            },
            "64b5cf38-70b9-43ab-aae0-0b3e3eb48d2c": {
                "id": 3,
                "test_plan": 1,
                "name": "launch3",
                "type": 0
            }
        },
        "state": 0,
        "started_by": "http://localhost:8000/user/ira",
        "finished": null,
        "parameters": {
            "options": {"started_by": "http://localhost:8000/user/ira"},
            "env": {"ENV_KEY": "ENV_VALUE"}
        }
    };

    var firstPageLaunches = multiplyLaunchResults(launches_results, 10);
    var secondPageLaunches = multiplyLaunchResults(launches_results, 1);
    var allLaunches = multiplyLaunchResults(launches_results, 11);

    function multiplyLaunchResults(res, count) {
        var launches = {
            "count": 11,
            "results": []
        };
        for (var i = 1; i < count + 1; i++) {
            var tmp = res;
            tmp.id = i;
            launches.results.push(tmp);
        }
        return JSON.stringify(launches);
    }

    angular.module('executeMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/1\/\?project=&project_id__in=/).respond(testPlan);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=1\&ordering=-type\&type=/).respond(launchItems);
            $httpBackend.whenPOST(/.*/, /.*/).respond(function () {
                return [200, {"launch_id": 100}, {}];
            });
            $httpBackend.whenGET(/.*api\/launches\/\?test_plan=1\&ordering=-created\&page=1\&page_size=10\&state=\&search=/)
                .respond(firstPageLaunches);
            $httpBackend.whenGET(/.*api\/launches\/\?test_plan=1\&ordering=-created\&page=2\&page_size=10\&state=\&search=/)
                .respond(secondPageLaunches);
            $httpBackend.whenGET(/.*api\/launches\/\?test_plan=1\&ordering=-created\&page=1\&page_size=25\&state=\&search=/)
                .respond(allLaunches);
            $httpBackend.whenGET(/.*/).passThrough();
        });
}