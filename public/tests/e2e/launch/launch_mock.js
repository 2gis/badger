module.exports.launchMock = function () {

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
        "id": 100,
        "name": "Barsuk",
        "project": 1,
        "hidden": true,
        "owner": 1
    };

    var deployTaskType = {
        "count": 1,
        "results": [{
            "id": 1,
            "test_plan": 100,
            "name": "Deploy task",
            "type": 1
        }]
    };

    var conclusiveTaskTypeEmpty = {
        "count": 0,
        "results": []
    };

    var conclusiveTaskType = {
        "count": 1,
        "results": [{
            "id": 1,
            "test_plan": 100,
            "name": "3",
            "type": 2
        }]
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

        var launches = {
        "count": 1,
        "results": [{
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
        }]
    };

    angular.module('launchMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/100\/\?project=/).respond(testPlan);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/launches\/\?test_plan=100&ordering=-created&page=1&page_size=10&state=&search=/)
                .respond(launches);
            $httpBackend.whenGET(/.*api\/comments\/\?ordering=&page=&page_size=&content_type__name=launch&object_pk=1/)
                .respond({ count: 0, results: [ ] });
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=&ordering=&type=1&test_plan=100/)
                .respond(deployTaskType);
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=&ordering=&type=2&test_plan=100/)
                .respond(conclusiveTaskTypeEmpty);
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=100&ordering=-type&type=/)
                .respond(launchItems);
            $httpBackend.whenPOST(/.*/, {
                "test_plan": "100",
                "type": "0",
                "name": "NEW ITEM",
                "command": "ECHO 1",
                "timeout": 1200
            }).respond(function () {
                    return [201, {
                        "id": 1,
                        "test_plan": 100,
                        "name": "NEW ITEM",
                        "command": "ECHO 1",
                        "timeout": 1200,
                        "type": 0
                    }, {}]
                });
            $httpBackend.whenPOST(/.*/, {
                "test_plan": "100",
                "type": "2",
                "name": "NEW ITEM",
                "command": "ECHO 1",
                "timeout": 1200
            }).respond(function () {
                    return [201, {
                        "id": 1,
                        "test_plan": 100,
                        "name": "NEW ITEM",
                        "command": "ECHO 1",
                        "timeout": 1200,
                        "type": 2
                    }, {}]
                });
            $httpBackend.whenPATCH(/.*/, {
                "id": 1,
                "test_plan": 100,
                "name": "EDIT LAUNCH",
                "type": 1,
                "$edit": false,
                "command": "ECHO 2",
                "timeout": "3600"
            }).respond(function () {
                return [200, {
                    "id": 1,
                    "test_plan": 100,
                    "name": "EDIT LAUNCH",
                    "type": 2
                }, {}];
            });
            $httpBackend.whenDELETE(/.*api\/launch-items\/1\/\?test_plan=&ordering=&type=/).respond(function () {
                launchItems = {
                    "count": 2,
                    "results": [{
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
                return [204];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}