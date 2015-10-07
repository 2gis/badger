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
        "started_by": "http://cdws.cd.test:80/user",
        "finished": "2015-03-20T05:55:51.151Z",
        "parameters": {
            "json_file": {},
            "options": {"started_by": "http://cdws.cd.test:80/user"},
            "env": {
                "NEW_ENV_KEY": "NEW_ENV_VALUE"
            }
        }
    };

    var resultsFailed = {
        "count": 0,
        "results": []
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
                "LAUNCH_ID": "2222"
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
                "LAUNCH_ID": "2222"
            },
            "delta": 0.016745
        },
        "status": "SUCCESS"
    };

    var requestNumber = 0;

    angular.module('executeMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/launches\/2222\/\?test_plan=&ordering=&page=1&page_size=9999&state=&search=/)
                .respond(function () {
                    requestNumber += 1;
                    if (requestNumber === 1) {
                        finishedLaunch.finished = null;
                        finishedLaunch.state = 0;
                    }
                    if (requestNumber === 2) {
                        finishedLaunch.state = 2;
                    }
                    return [200, finishedLaunch];
                });
            $httpBackend.whenGET(/.*api\/testresults\/\?launch=2222&ordering=-duration&page=1&page_size=25&state=1&search=/)
                .respond(resultsFailed);
            $httpBackend.whenGET(/.*api\/tasks\/d068f6a3-f8e2-4c63-8a8a-f81aa7d25455\//)
                .respond(task1);
            $httpBackend.whenGET(/.*api\/tasks\/06b2432b-eef8-4a10-bb8d-ac0ae1e8956e\//)
                .respond(task2);
            $httpBackend.whenGET(/.*api\/launches\/2222\/terminate_tasks\/\?test_plan=&ordering=&page=1&page_size=9999&state=&search=/)
                .respond({ message: 'Termination done.' });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}