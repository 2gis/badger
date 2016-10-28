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
        $routeProvider.when('/launch/:launchId/:state', {
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

app.filter('toArray', function() { return function(obj) {
    if (!(obj instanceof Object)) return obj;
    return _.map(obj, function(val, key) {
        return Object.defineProperty(val, '$key', {__proto__: null, value: key});
    });
}});

app.controller('LaunchCtrl', ['$q', '$scope', '$rootScope', '$routeParams', '$filter', '$timeout', '$window', 'ngTableParams',
                'hotkeys', 'appConfig', 'TestResult', 'Launch', 'Task', 'Comment', 'Bug', 'SortLaunchItems', 'TestPlan',
                'LaunchHelpers', 'LaunchFilters', 'GetChartStructure', 'SeriesStructure', 'GetChartsData', '$location', 'LaunchItem',
    function ($q, $scope, $rootScope, $routeParams, $filter, $timeout, $window, ngTableParams,
              hotkeys, appConfig, TestResult, Launch, Task, Comment, Bug, SortLaunchItems, TestPlan,
              LaunchHelpers, LaunchFilters, GetChartStructure, SeriesStructure, GetChartsData, $location, LaunchItem)
    {
        var initialized = false;

        $scope.activeTab = 'counters';
        $scope.setActiveTab = function(tabName) {
            $scope.activeTab = tabName;
        };

        function getProfileAndDrawTable() {
            $rootScope.getProfile().then(function(profile) {
                $rootScope.getProjectSettings($rootScope.getActiveProject(), 'results_view').then(function(type){
                    $scope.result_view = parseInt(type);
                    $rootScope.getProjectSettings($rootScope.getActiveProject(), 'result_preview').then(function(type) {
                        $scope.result_preview = type === 0 ? 'head' : 'tail';
                        $scope.result_preview = profile && profile.settings.result_preview ? profile.settings.result_preview : $scope.result_preview;
                        drawTable(profile, $scope.result_view);
                    });
                });
            });
        }

        $scope.launch_items = [];
        function addLaunchItemsToLaunch(items, state) {
            if (items.length !== 0) {
                items = _.sortBy(items, function(item) {
                    return -item.count;
                });
                if (state === appConfig.TESTRESULT_FAILED) {
                    $scope.launch_item_id = items[0].launch_item_id
                }
                $scope.launch_items[state] = items[0].launch_item_id;
                return items;
            } else {
                return items;
            }
        }

        Launch.get({ launchId: $routeParams.launchId }, function (launch) {
            if($rootScope.getActiveProject() === null) {
                TestPlan.get({'testPlanId': launch.test_plan}, function(testplan) {
                    $rootScope.selectProject(testplan.project);
                    getProfileAndDrawTable();
                });
            } else {
                getProfileAndDrawTable();
            }
            $scope.launch = launch;

            $scope.launch.items = [];
            _.each($scope.states, function(state) {
                getLaunchCounts(state).then(function(items) {
                    $scope.launch.items[state] = addLaunchItemsToLaunch(items, state);
                });
            });

            if ($scope.launch.parameters.options) {
                if ('last_commits' in $scope.launch.parameters.options) {
                    $scope.showDiffByCommits = true;
                    $scope.drawDiffChart();
                }
            }

            if (!$scope.launch.duration) {
                $scope.launch.duration = (Date.parse(launch.finished) - Date.parse(launch.created)) / 1000;
            } else {
                $scope.launch.duration = $scope.launch.duration;
            }
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
        $scope.index = null;
        $scope.tasks = [];
        $scope.states = [
            appConfig.TESTRESULT_PASSED,
            appConfig.TESTRESULT_FAILED,
            appConfig.TESTRESULT_SKIPPED,
            appConfig.TESTRESULT_BLOCKED];
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
                $scope.apiErrors = result.data.message;
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

        $scope.setLaunchItemId = function(id, state) {
            if (state !== null) {
                $scope.launch_item_id = $scope.launch_items[state];
            } else {
                $scope.launch_item_id = id;
            }
        };

        $scope.$watch('launch_item_id', function() {
            if (typeof $scope.tableParams !== 'undefined') {
                $scope.tableParams.reload();
            }
        });

        $scope.openResults = function (item) {
            $scope.index = item;

            $scope.disableMainPrev = (item.id === $scope.fullNavigationFirstId);
            $scope.disableMainNext = (item.id === $scope.fullNavigationLastId);

            $scope.disableFailedPrev = (item.id === $scope.failedNavigationFirstId);
            $scope.disableFailedNext = (item.id === $scope.failedNavigationLastId);

            var selection = $window.getSelection();
            if (selection.type === 'Range') {
                return false;
            }
            var modal = $('#TestDetailsModal');

            modal.modal('hide');

            setSelected(item.id);
            $scope.modalSuite = item.suite;
            $scope.modalName = item.name;
            $scope.modalState = item.state;
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
        };

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

        function findNextItem(item, state, direction, currentFound) {
            if (!currentFound) {
                currentFound = false;
            }
            var suites = $scope.tableParams.data;
            if (direction === 'forward') {
                for (var i = 0; i < suites.length; i++) {
                    for (var j = 0; j < suites[i].length; j++) {
                        if (state instanceof Array) {
                            if (currentFound && state.indexOf(suites[i][j].state) !== -1) {
                                return suites[i][j];
                            }
                        } else {
                            if (currentFound && suites[i][j].state == state) {
                                return suites[i][j];
                            }
                        }
                        if (suites[i][j].id === item.id)
                            currentFound = true;
                        }
                }
            } else {
                for (var i = suites.length - 1; i >= 0; i--) {
                    for (var j = suites[i].length - 1; j >= 0; j--) {
                        if (state instanceof Array) {
                            if (currentFound && state.indexOf(suites[i][j].state) !== -1) {
                                return suites[i][j];
                            }
                        } else {
                            if (currentFound && suites[i][j].state == state) {
                                return suites[i][j];
                            }
                        }
                        if (suites[i][j].id === item.id) {
                            currentFound = true;
                        }
                    }
                }
            }
            // Current item is last, find from start
            if (currentFound) {
                return findNextItem(item, state, direction, true);
            }
        }

        $scope.nextItem = function(states) {
            if ($scope.disableMainNext) {
                return;
            }

            if (_.isArray(states)) {
                $scope.openResults(findNextItem($scope.index, states, 'forward'));
            } else {
                $scope.openResults(findNextItem($scope.index, $scope.states, 'forward'));
            }
        };

        $scope.prevItem = function(states) {
            if ($scope.disableMainPrev) {
                return;
            }

            if (_.isArray(states)) {
                $scope.openResults(findNextItem($scope.index, states, 'backward'));
            } else {
                $scope.openResults(findNextItem($scope.index, $scope.states, 'backward'));
            }
        };

        hotkeys.add({ combo: 'j', callback: $scope.nextItem });
        hotkeys.add({ combo: 'right', callback: $scope.nextItem });
        hotkeys.add({ combo: 'k', callback: $scope.prevItem });
        hotkeys.add({ combo: 'left', callback: $scope.prevItem });

        var create_table_attempt = 0;

        function drawTable(profile, type) {
            if (type === appConfig.RESULT_VIEW_DEFAULT) {
                $scope.tableParams = defaultTable(profile);
            }
            if (type === appConfig.RESULT_VIEW_TREE) {
                $scope.tableParams = treeTable();
            }
        }

        function defaultTable (profile) {
            return new ngTableParams({
                page: 1,
                count: 25,
                sorting: {
                    duration: 'desc'
                }
            }, {
                total: 0,
                getData: function ($defer, params) {
                    create_table_attempt += 1;
                    if (profile && create_table_attempt === 1) {
                        $scope.tableParams.$params.count =
                            profile.settings ? profile.settings.testresults_on_page : 25;
                    }
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
                        launch_item_id: $scope.launch_item_id,
                        search: params.$params.filter.failure_reason
                    }, function (result) {
                        params.total(result.count);
                        $scope.data = _.groupBy(result.results, function (item) {
                            return item.launch_item_id;
                        });


                        $scope.data = $filter('toArray')($scope.data);
                        var dataLength = 0;
                        _.each($scope.data, function(group) {
                            dataLength += group.length;
                        });

                        $defer.resolve($scope.data);
                        $scope.tableParams.settings({counts: dataLength >= 10 ? [10, 25, 50, 100] : []});

                        if ($scope.data.length > 0) {
                            $scope.fullNavigationFirstId = _.first(_.first($scope.data)).id;
                            $scope.fullNavigationLastId = _.last(_.last($scope.data)).id;
                        }
                    });
                }
            });
        }

        function treeTable() {
            return new ngTableParams({
                count: 99999
            }, {
                total: 0,
                getData: function ($defer, params) {
                    TestResult.get({
                        launchId: $routeParams.launchId,
                        page: 1,
                        pageSize: 9999,
                        state: $routeParams.state,
                        search: params.$params.filter.failure_reason
                    }, function (result) {
                        params.total(result.count);
                        $scope.data = result.results;
                        _.each($scope.data, function (res) {
                            try {
                                res.failure_reason = JSON.parse(res.failure_reason).message;
                            } catch (error) {
                                res.failure_reason = res.failure_reason;
                            }
                        });
                        $scope.data = _.groupBy(result.results, function (item) {
                            return item.suite;
                        });

                        $scope.data = _.mapObject($scope.data, function (cases, key){
                            cases = setOrder(cases);
                            return $filter('orderBy')(cases, ['order', '-duration']);
                        });

                        _.each($scope.data, function(group, group_name) {
                            $scope.data[group_name].passed = _.filter(group, function(result) {
                                return result.state === 0;
                            }).length;
                            $scope.data[group_name].skipped = _.filter(group, function(result) {
                                return result.state === 2;
                            }).length;
                            $scope.data[group_name].failed = _.filter(group, function(result) {
                                return result.state === 1;
                            }).length;
                            $scope.data[group_name].blocked = _.filter(group, function(result) {
                                return result.state === 3;
                            }).length;
                        });

                        $scope.data = $filter('toArray')($scope.data)
                        $scope.data = $filter('orderBy')($scope.data, ['-failed+blocked', '$key']);

                        $defer.resolve($scope.data);
                        $scope.tableParams.settings({counts: []});

                        // Fill navigation variables
                        var failedAndBlockedResults = _.map($scope.data, function(group) {
                            return _.filter(group, isBlockedOrFailed);
                        });

                        failedAndBlockedResults = _.filter(failedAndBlockedResults, isNotEmptyArray);

                        if ($scope.data.length !== 0) {
                            $scope.fullNavigationFirstId = _.first(_.first($scope.data)).id;
                            $scope.fullNavigationLastId = _.last(_.last($scope.data)).id;

                            if (failedAndBlockedResults.length !== 0) {
                                $scope.failedNavigationFirstId = _.first(_.first(failedAndBlockedResults)).id;
                                $scope.failedNavigationLastId = _.last(_.last(failedAndBlockedResults)).id;
                            }
                        }
                    });
                }
            });
        }

        function setOrder(group) {
            _.each(group, function(item) {
                switch(item.state) {
                    case 0:
                        item.order = 2;
                        break;
                    case 1:
                        item.order = 1;
                        break;
                    case 2:
                        item.order = 3;
                        break;
                    case 3:
                        item.order = 0;
                        break;
                    default:
                        item.order = 4;
                }
            });
            return group;
        }

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
                    $scope.launch.duration = (Date.parse(launch.finished) - Date.parse(launch.created)) / 1000;
                    $scope.getTasksDetails($scope.launch.tasks);
                });
                $scope.apiErrors = response.message;
            }, function (response) {
                $scope.apiErrors = response.data.message || response.details;
                $scope.terminateButtonActive = true;
            });
        };

        $(".modal-wide").on("show.bs.modal", function() {
          var height = $(window).height() - 250;
          $(this).find(".modal-body").css("max-height", height);
        });

        function isBlockedOrFailed(result) {
            return result.state === 1 || result.state === 3;
        }

        function isNotEmptyArray(array) {
            return array.length > 0;
        }

        $scope.selectedItemId = null;
        function setSelected(selectedItemId) {
           $scope.selectedItemId = selectedItemId;
        }

        function getLaunches (testplan_id, last_commits) {
            var deferred = $q.defer();
            Launch.custom_list({
                testPlanId: testplan_id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                build_hash__in: last_commits.join()
            }, function (response) {
                var launches = LaunchHelpers.cutDate(response.results);
                launches = _.groupBy(launches, function(launch) {
                    return launch.build.hash;
                });
                deferred.resolve(launches);
            });
            return deferred.promise;
        }

        function getLaunchCounts (state) {
            var deferred = $q.defer();
            Launch.custom_list({
                results_group_count: $routeParams.launchId,
                state: state
            }, function (response) {
                deferred.resolve(response.results);
            });
            return deferred.promise;
        }

        function pushColumnCharts(charts, labels, series) {
            charts.push(
                GetChartStructure(
                    'stacking',
                    sliceArray(labels),
                    SeriesStructure.getAbsolute(sliceArray(series.absolute.failed),
                        sliceArray(series.absolute.skipped), sliceArray(series.absolute.passed))
                ));
        }

        function sliceArray(array) {
            return array.slice(array.length - 10, array.length);
        }

        $scope.drawDiffChart = function() {
            getLaunches($scope.launch.test_plan,
                        $scope.launch.parameters.options.last_commits).then(function(launches) {
                $scope.launch.charts = [];

                launches = LaunchHelpers.cutDate(launches);
                launches = LaunchFilters.getMax(launches);
                launches = _.filter(launches, LaunchFilters.isEmptyResults);
                launches = LaunchHelpers.addStatisticData(launches);
                launches = LaunchHelpers.addCommitOrder($scope.launch.parameters.options.last_commits, launches);
                launches = _.sortBy(launches, 'commit_order');
                launches.reverse();

                var seriesData = GetChartsData.series(launches);
                var labels = GetChartsData.labels(launches, true);

                pushColumnCharts($scope.launch.charts, labels, seriesData);
            });
        }

        $scope.redirect = function(evt, url) {
            (evt.button === 1 || evt.ctrlKey === true) ?
                $window.open('#' + url, '_blank') : $location.path(url);
        };
    }
]);
