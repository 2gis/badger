'use strict';

var app = angular.module('testReport.testPlan.execute', [
    'ngRoute',
    'ngCookies',
    'testReportServices',
    'ngTable'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/testplan/:testPlanId/execute', {
            templateUrl: '/static/app/partials/testplan/execute/execute.html',
            controller: 'TestPlanExecuteCtrl'
        }).when('/testplan/:testPlanId/execute/:launchId', {
            templateUrl: '/static/app/partials/testplan/execute/execute.html',
            controller: 'TestPlanExecuteCtrl'
        });
    }
]);

app.run(function($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.controller('TestPlanExecuteCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'appConfig', 'TestPlan', 'LaunchItem', 'Launch', 'SortLaunchItems', 'ngTableParams',
    function ($rootScope, $scope, $routeParams, $location, appConfig, TestPlan, LaunchItem, Launch, SortLaunchItems, ngTableParams) {
        TestPlan.get({ 'testPlanId': $routeParams.testPlanId }, function (result) {
            $rootScope.selectProject(result.project);
            $scope.name = result.name;
        });
        $scope.formErrors = null;

        function executeLaunches(testPlanId, testPlan, modalDialog) {
            TestPlan.execute({ 'testPlanId': testPlanId }, testPlan, function () {
                if (modalDialog) {
                    $('#ConfirmationModal').on('hidden.bs.modal', function () {
                        $location.path('testplan/' + testPlanId);
                    });
                } else {
                    $location.path('testplan/' + testPlanId);
                }
            }, function (result) {
                $scope.formErrors = result.data.detail || result.data.message;
            });
        }

        LaunchItem.get({
            'testPlanId': $routeParams.testPlanId,
            'ordering': '-type' // deploy script always first
        }, function (result) {
            $scope.totalLaunchItems = result.count;
            $scope.launchItems = result.results;
        });

        $scope.changeSelection = function (item) {
            if (item.type === appConfig.TASK_TYPE_DEPLOY) {
                item.$selected = true;
                return;
            }
            item.$selected = !item.$selected;
        };

        $scope.selectAllTasks = function (handle) {
            _.each($scope.launchItemsTable.data, function (item){
                if (item.type === appConfig.TASK_TYPE_DEPLOY) {
                    item.$selected = true;
                } else {
                    item.$selected = handle;
                }
            });
        };

        $scope.launchItemsTable = new ngTableParams({
            page: 1,
            count: 10000,
            sorting: {
                created: 'desc'
            }
        }, {
            counts: [],
            total: 1,
            getData: function($defer) {
                LaunchItem.get({
                    'testPlanId': $routeParams.testPlanId,
                    'ordering': '-type' // deploy script always first
                }, function (result) {
                    $defer.resolve(SortLaunchItems.byType(_.each(result.results, function (item) {
                        if (item.type === appConfig.TASK_TYPE_DEPLOY) {
                            item.$selected = true;
                        }
                    })));
                });
            }
        });

        // Form handler
        $scope.environmentItems = [];
        $scope.addEnvironmentItem = function () {
            $scope.environmentItems.push({ key: '', value: '' });
        };
        $scope.removeEnvironmentItem = function (index) {
            $scope.environmentItems.splice(index, 1);
        };

        $scope.relaunch_data = null;
        if (typeof $routeParams.launchId !== 'undefined') {
            $scope.launchId = $routeParams.launchId;
            Launch.get({launchId: $scope.launchId}, function (result) {
                _.each(result.parameters.env, function (value, key) {
                    $scope.environmentItems.push({ key: key, value: value });
                });
                $scope.testPlan.jsonFile = JSON.stringify(result.parameters.json_file);
                if (result.parameters.json_file === null) {
                    $scope.testPlan.jsonFile = '{}';
                }
            });
        }

        $scope.execute = function (formData) {
            var testPlan = new TestPlan();
            testPlan.options = {
                started_by: $location.protocol() + '://' +
                $location.host() + ':' +
                $location.port() + '/user/' +
                $rootScope.profile.username
            };
            if (formData) {
                testPlan.json_file = angular.fromJson(formData.jsonFile);
            }

            testPlan.env = {};
            _.each($scope.environmentItems, function (item) {
                testPlan.env[item.key] = item.value;
            });

            testPlan.launch_items = [];
            _.each($scope.launchItemsTable.data, function (launchItem) {
                if (launchItem.$selected) {
                    testPlan.launch_items.push(launchItem.id);
                }
            });

            if (testPlan.launch_items.length === 1) {
                var modal = $('#ConfirmationModal');
                $scope.modalTitle = 'Attention';
                $scope.modalBody = 'Are you sure you want to execute only deploy script?';
                $scope.modalCallBack = function () {
                    executeLaunches($routeParams.testPlanId, testPlan, true);
                };
                modal.modal('show');
            } else {
                executeLaunches($routeParams.testPlanId, testPlan, false);
            }
        };
    }
]);
