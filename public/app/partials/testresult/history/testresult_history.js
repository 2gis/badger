'use strict';

var app = angular.module('testReport.testResult.history', [
    'ngRoute',
    'testReportServices'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/testresult/:testResultId/history', {
        templateUrl: '/static/app/partials/testresult/history/testresult_history.html',
        controller: 'TestResultHistoryCtrl'
    });

    $routeProvider.when('/testresult/:testResultId/history/:days', {
        templateUrl: '/static/app/partials/testresult/history/testresult_history.html',
        controller: 'TestResultHistoryCtrl'
    });
}]);

app.controller('TestResultHistoryCtrl', ['$scope', '$routeParams', '$q', 'TestResult', 'ngTableParams', 'Launch', 'LaunchItem',
    function ($scope, $routeParams, $q, TestResult, ngTableParams, Launch, LaunchItem) {
        // Fix absent scrollbar
        var $body = angular.element('body');
        if ($body.hasClass('modal-open')) {
            $body.removeClass('modal-open');
            $('.modal-backdrop').remove();
        }

        TestResult.get({ testResultId: $routeParams.testResultId}, function (result) {
            $scope.suite = result.suite;
            $scope.name = result.name;

            var days = 30;
            if ($routeParams.days) {
                days = $routeParams.days;
            }

            TestResult.custom_list({
                history: $routeParams.testResultId,
                page: 1,
                page_size: 50,
                days: days
            }, function(result) {
                var results = result.results;

                if (results.length === 0) {
                    $scope.dataAbsent = true;
                    return;
                }

                addDateToTestresults(results).then(function(dates) {
                    for (var i = 0; i < results.length; i++) {
                        results[i].created = dates[i];
                        drawTable(results);
                    }
                });
            });
        });


        function drawTable(data) {
            $scope.tableParams = new ngTableParams({
                    page: 1,
                    count: 50,
                },{
                    total: data.length,
                    counts: [],
                    getData: function($defer) {
                        $defer.resolve(data);
                }
            });
        }

        function addDateToTestresults(testresults) {
            var promises = [];
            _.each(testresults, function(testresult) {
                var promise = getDateByLaunchId(testresult.launch);
                promises.push(promise);
            });
            return $q.all(promises);
        }

        function getDateByLaunchId (id) {
            var deferred = $q.defer();
            Launch.get({
                launchId: id
            }, function (response) {
                deferred.resolve(response.created);
            });
            return deferred.promise;
        }

    }
]);
