'use strict';

var app = angular.module('testReport.launch', [
    'ngRoute',
    'ngTable',
    'ngResource',
    'cfp.hotkeys',
    'testReportServices',
    'testReportFilters',
    'ngSanitize'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/launch/:launchId', {
            templateUrl: '/static/app/partials/launch/launch.html',
            controller: 'LaunchCtrl'
        });
    }
]);

app.directive('goClick', function ($location) {
    return function (scope, element, attrs) {
        var path;

        attrs.$observe('goClick', function (val) {
            path = val;
        });

        element.bind('click', function () {
            scope.$apply(function () {
                $location.path(path);
            });
        });
    };
});

app.controller('LaunchCtrl', ['$scope', '$rootScope', '$routeParams', '$filter', '$timeout', 'ngTableParams', 'hotkeys', 'appConfig', 'TestResult', 'Launch', 'Task', 'Comment', 'Bug', 'SortLaunchItems', 'TestPlan',
    function ($scope, $rootScope, $routeParams, $filter, $timeout, ngTableParams, hotkeys, appConfig, TestResult, Launch, Task, Comment, Bug, SortLaunchItems, TestPlan) {
        var initialized = false;

        Launch.get({ launchId: $routeParams.launchId }, function (launch) {
            if($rootScope.getActiveProject() === null) {
                TestPlan.get({'testPlanId': launch.test_plan}, function(testplan) {
                    $rootScope.selectProject(testplan.project);
                });
            }
            $scope.launch = launch;
            $scope.launch.duration = parseInt((Date.parse(launch.finished) - Date.parse(launch.created)) / (1000 * 60));
            $scope.getTasksDetails($scope.launch.tasks);
        });

        $scope.jira = JIRA_INTEGRATION;
        $scope.finished = true;
        $scope.modalSuite = '';
        $scope.modalName = '';
        $scope.modalBody = '';
        $scope.modalId = 0;
        $scope.state = appConfig.TESTRESULT_FAILED;
        $scope.data = [];
        $scope.dataGroup = [];
        $scope.index = 0;
        $scope.tasks = [];
        $scope.form_comment = '';
        $scope.comment_disabled = false;
        $scope.bugs = [];
        $scope.timers = [];
        $scope.currentTask = null;
        $scope.terminateButtonActive = true;
        $scope.terminateMessage = null;

        $scope.$watch('regExp', function (text) {
            var pattern = '/(?:)/';
            if (text) {
                //escape special symbols to avoid problem with regexp
                pattern = text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            }
            var regexp = new RegExp(pattern, 'm');
            _.each(_.reduceRight($scope.data, function(a, b) { return a.concat(b); }), function (item) {
                item.hidden = false;
                if (!regexp.test(item.failure_reason)) {
                    item.hidden = true;
                }
            });
        });

        $scope.addBug = function () {
            var bug = new Bug();
            bug.externalId = $scope.bugId;
            bug.regexp = $scope.regExp;
            Bug.save(bug, function (result) {
                $scope.bugId = null;
                $scope.regExp = null;
                $scope.apiErrors = null;
                $scope.updateBugBinding();
                $scope.tableParams.reload();
            }, function (result) {
                $scope.apiErrors = result.data.detail;
            });
        };

        $scope.updateBugBinding = function () {
            Bug.get({}, function(result) {
                $scope.bugs = result.results;
                _.each($scope.data, function (item) {
                    item.bugs = [];
                });
                _.each($scope.bugs, function (bug) {
                    bug.regexp = bug.regexp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    var regexp = new RegExp(bug.regexp, 'm');
                    _.each(_.reduceRight($scope.data, function(a, b) { return a.concat(b); }), function (item) {
                        if (!_.find(item.bugs, function (b) {
                                return b.externalId === bug.externalId && b.regexp === bug.regexp;
                            })) {
                            if (regexp.test(item.failure_reason)) {
                                if (!item.bugs) {
                                    item.bugs = [];
                                }
                                item.bugs.push(bug);
                            }
                        }
                    });
                });
            });
        };

        $scope.$watch('data', function () {
            $scope.updateBugBinding();
        });

        function updateTask(taskId) {
            $scope.timers.push($timeout(
                function () {
                    Task.get({taskId: taskId}, function(data) {
                        _.each($scope.tasks, function(value) {
                            if (value.key == data.id) {
                                value['result'] = data;
                                if (data.status === 'STARTED' || data.status === 'PENDING') {
                                    updateTask(taskId);
                                } else {
			 	                    Launch.get({ launchId: $routeParams.launchId }, function (launch) {
                                        $scope.launch = launch;
                                    });
				                }
                            }
                        });
                    });
                }, 5000
            ));
        }

        $scope.getTasksDetails = function(tasks) {
            _.each(tasks, function(value, key) {
                $scope.tasks.push({key: key, item: value});
                Task.get({taskId: key}, function(data) {
                    _.each($scope.tasks, function(value) {
                        if (value.key == data.id) {
                            value['result'] = data;
                            if (data.status === 'STARTED' || data.status === 'PENDING') {
                                updateTask(key);
                            }
                        }
                    });
                });
            });
            $scope.tasks.sort(function (a, b) {
                return b.item.type - a.item.type;
            });

            //sorting
            _.each($scope.tasks, function(task) {
                task.name = task.item.name;
                task.type = task.item.type;
            });
            $scope.tasks = SortLaunchItems.byType($scope.tasks);
        };

        $scope.$watch('state', function () {
            // Workaround Not call reload after first change of state, to prevent getting GET request twice on page load
            if (initialized) {
                $scope.tableParams.reload();
            } else {
                initialized = true;
            }
        });

        $scope.openResults = function (item, index) {
            var modal = $('#TestDetailsModal');

            modal.modal('hide');
            if (item.id !== $scope.dataGroup[0].id) {
                for (var i = 0; i < $scope.dataGroup.length; ++i) {
                    if ($scope.dataGroup[i].id === item.id) {
                        index = i;
                        break;
                    }
                }
            }

            $scope.index = index;
            $scope.modalSuite = item.suite;
            $scope.modalName = item.name;
            $scope.modalBody = item.failure_reason;
            $scope.modalId = item.id;
            modal.modal('show');
        };

        $scope.$on(
            "$destroy",
            function (event) {
                _.each($scope.timers, function (timer) {
                    $timeout.cancel(timer);
                })
            }
        );

        $scope.openTask = function (task) {
            if (task.result.status === 'PENDING') {
                return;
            }
            $scope.currentTask = task;
        };

        $scope.closeTask = function () {
            $scope.currentTask = null;
        }

        $scope.openAddCommentModal = function() {
            var modal = $('#AddCommentModal');
            modal.modal('show');
        };

        $scope.submitComment = function () {
            $scope.comment_disabled = true;
            if ($scope.form_comment !== '') {
                var comm = new Comment();
                comm.comment = $scope.form_comment;
                comm.content_type = 'launch';
                comm.object_pk = $routeParams.launchId;
                comm.$save(function(result) {
                    $scope.form_comment = '';
                    $scope.comment = '';
                    $('#AddCommentModal').modal('hide');
                    $scope.comments.reload();
                    $scope.comment_disabled = false;
                    $scope.formErrors = null;
                }, function (result) {
                    $scope.formErrors = result;
                })
            }
        };

        $scope.nextItem = function () {
            if ($scope.index >= $scope.dataGroup.length - 1 || $scope.dataGroup.length === 0) {
                return;
            }

            $scope.index += 1;
            $scope.openResults($scope.dataGroup[$scope.index], $scope.index);
        };

        $scope.prevItem = function () {
            if ($scope.index === 0) {
                return;
            }

            $scope.index -= 1;
            $scope.openResults($scope.dataGroup[$scope.index], $scope.index);
        };

        hotkeys.add({ combo: 'j', callback: $scope.nextItem });
        hotkeys.add({ combo: 'right', callback: $scope.nextItem });
        hotkeys.add({ combo: 'k', callback: $scope.prevItem });
        hotkeys.add({ combo: 'left', callback: $scope.prevItem });

        $scope.tableParams = new ngTableParams({
            page: 1,
            count: 25,
            sorting: {
                duration: 'desc'
            }
        }, {
            total: 0,
            getData: function ($defer, params) {
                var ordering;

                for (var prop in params.sorting()) {
                    ordering = prop;
                    if (params.sorting()[prop] !== 'asc') {
                        ordering = '-' + prop;
                    }
                    break;
                }
                TestResult.get({
                    launchId: $routeParams.launchId,
                    page: params.page(),
                    pageSize: params.count(),
                    ordering: ordering,
                    state: $scope.state,
                    search: params.$params.filter.failure_reason
                }, function (result) {
                    params.total(result.count);
                    $scope.data = _.groupBy(result.results, function (item) { return item.launch_item_id });

                    var arrays = $.map($scope.data, function(value) { return [value]; });
                    var data = [];
                    $scope.dataGroup = data.concat.apply(data, arrays);

                    $defer.resolve($scope.data);
                    $scope.tableParams.settings({ counts: $scope.dataGroup.length >= 10 ? [10, 25, 50, 100] : []});
                });
            }
        });

        $scope.comments = new ngTableParams({
            page: 1,
            count: 3,
            sorting: {
                submit_date: 'desc'
            }
        }, {
            total: 0,
            counts: [],
            getData: function ($defer, params) {
                var ordering;
                for (var prop in params.sorting()) {
                    ordering = prop;
                    if (params.sorting()[prop] !== 'asc') {
                        ordering = '-' + prop;
                    }
                    break;
                }
                Comment.get({
                    content_type__name: 'launch',
                    object_pk: $routeParams.launchId,
                    page: params.page(),
                    pageSize: params.count(),
                    ordering: ordering
                }, function (result) {
                    params.total(result.count);
                    $defer.resolve(result.results);
                });
            }
        });

        $scope.getLaunchItemById = function (launchItemId) {
            launchItemId = parseInt(launchItemId);
            for (var i = 0; i < $scope.tasks.length; i++) {
                if ($scope.tasks[i].item.id === launchItemId) {
                    return $scope.tasks[i].item;
                }
            }
            return {'name': 'No launch item binding'};
        };

        $scope.terminateLaunchTasks = function (launchId) {
            $scope.terminateButtonActive = false;
            Launch.terminate_tasks({ launchId: launchId }, function (response) {
                $scope.tasks = [];
                Launch.get({ launchId: $routeParams.launchId }, function (launch) {
                    $scope.launch = launch;
                    $scope.launch.duration = parseInt((Date.parse(launch.finished) - Date.parse(launch.created)) / (1000 * 60));
                    $scope.getTasksDetails($scope.launch.tasks);
                });
                $scope.apiErrors = response.message;
            }, function (response) {
                $scope.apiErrors = response.data.message || response.details;
                $scope.terminateButtonActive = true;
            });
        };
    }
]);
