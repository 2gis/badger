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
            "name": "launch1",
            "type": 1
        }, {
            "id": 2,
            "test_plan": 1,
            "name": "launch2",
            "type": 0
        }, {
            "id": 3,
            "test_plan": 1,
            "name": "launch3",
            "type": 0
        }]
    };

    var finishedLaunch = {
        "id": 2222,
        "test_plan": 1,
        "created": "2015-03-20T05:54:39.768Z",
        "counts": {
            "failed": 2,
            "skipped": 0,
            "total": 2,
            "passed": 0,
            "blocked": 0
        },
        "tasks": {
            "d068f6a3-f8e2-4c63-8a8a-f81aa7d25455": {
                "id": 1,
                "test_plan": 1,
                "name": "Deploy tests",
                "command": "ECHO 1",
                "timeout": 1200,
                "type": 1
            },
            "06b2432b-eef8-4a10-bb8d-ac0ae1e8956e": {
                "id": 2,
                "test_plan": 1,
                "name": "Regular task",
                "command": "ECHO 2",
                "timeout": 1200,
                "type": 0
            }
        },
        "state": 2,
        "started_by": "http://cdws.cd.test:80/user/o.puzankova",
        "finished": "2015-03-20T05:55:51.151Z",
        "parameters": {
            "json_file": {},
            "options": {"started_by": "http://cdws.cd.test:80/user/o.puzankova"},
            "env": {
                "NEW_ENV_KEY": "NEW_ENV_VALUE"
            }
        }
    };

    var resultsPassed = {
        "count": 1,
        "results": [{
            "name": "TEST PASSED",
            "suite": "SUITE PASSED",
            "state": 0,
            "failure_reason": "",
            "duration": 0.5
        }]
    };

    var resultsFailed = {
        "count": 2,
        "results": [{
            "id": 1,
            "launch": 2222,
            "name": "TEST1 FAILED",
            "suite": "SUITE1 FAILED",
            "state": 1,
            "failure_reason": "FAILURE1 REASON",
            "duration": 0.5,
            "launch_item_id": 111
        }, {
            "id": 2,
            "launch": 2222,
            "name": "TEST2 FAILED",
            "suite": "SUITE2 FAILED",
            "state": 1,
            "failure_reason": "FAILURE2 REASON",
            "duration": 1.5,
            "launch_item_id": 111
        }]
    };

    var task1 = {
        "id": "d068f6a3-f8e2-4c63-8a8a-f81aa7d25455",
        "result": {
            "end": "2015-04-08T12:13:03.394272",
            "stderr": "",
            "stdout": "1\n",
            "cmd": "echo 1",
            "return_code": 0,
            "start": "2015-04-08T12:13:03.377527",
            "env": {
                "HOME": "//opt/static/workdirs/2015-04-08-06-13-173143",
                "LAUNCH_ID": "2222",
                "REPORT_API_URL": "http://cdws.cd.ostack.test/api",
                "WORKSPACE": "//opt/static/workdirs/2015-04-08-06-13-173143"
            },
            "delta": 0.016745
        },
        "status": "SUCCESS"
    };
    var task2 = {
        "id": "06b2432b-eef8-4a10-bb8d-ac0ae1e8956e",
        "result": {
            "end": "2015-04-08T12:13:03.394272",
            "stderr": "",
            "stdout": "1\n",
            "cmd": "echo 1",
            "return_code": 0,
            "start": "2015-04-08T12:13:03.377527",
            "env": {
                "HOME": "//opt/static/workdirs/2015-04-08-06-13-173143",
                "LAUNCH_ID": "2222",
                "REPORT_API_URL": "http://cdws.cd.ostack.test/api",
                "WORKSPACE": "//opt/static/workdirs/2015-04-08-06-13-173143"
            },
            "delta": 0.016745
        },
        "status": "SUCCESS"
    };

    var result = {
        "id": 1,
        "launch": 1,
        "name": "NAME",
        "suite": "SUITE",
        "state": 1,
        "failure_reason": "FAILURE",
        "duration": 9.0,
        "launch_item_id": null
    };

    var allLaunchResults = create(result, 12);
    var firstPageResults = create(result, 10);
    var secondPageResults = create(result, 2);

    function create(res, count) {
        var l = {
            "count": 12,
            "results": []
        };
        for (var i = 1; i < count + 1; i++) {
            var tmp = res;
            tmp.id = i;
            l.results.push(tmp);
        }
        return JSON.stringify(l);
    }

    angular.module('executeMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/1\/\?project=&project_id__in=/).respond(testPlan);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/launch-items\/\?test_plan=1&ordering=-type&type=/).respond(launchItems);
            $httpBackend.whenPOST(/.*/, /.*/).respond(function () {
                return [200, {"launch_id": 100}, {}];
            });
            $httpBackend.whenGET(/.*api\/launches\/2222\/\?test_plan=&ordering=&page=1&page_size=9999&state=&search=/)
                .respond(finishedLaunch);
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=1&page_size=25&state=1&search=/)
                .respond(resultsFailed);
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=1&page_size=25&state=0&search=/)
                .respond(resultsPassed);
            $httpBackend.whenGET(/.*api\/tasks\/d068f6a3-f8e2-4c63-8a8a-f81aa7d25455\//)
                .respond(task1);
            $httpBackend.whenGET(/.*api\/tasks\/06b2432b-eef8-4a10-bb8d-ac0ae1e8956e\//)
                .respond(task2);
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=1&page_size=25&state=2&search=/)
                .respond(allLaunchResults);
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=1&page_size=10&state=2&search=/)
                .respond(firstPageResults);
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=2&page_size=10&state=2&search=/)
                .respond(secondPageResults);
            $httpBackend.whenGET(/.*/).passThrough();
        });
}