'use strict';

var app = angular.module('testReport.testResult', [
    'ngRoute',
    'testReportServices'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/testresult/:testResultId', {
        templateUrl: '/static/app/partials/testresult/testresult.html',
        controller: 'TestResultCtrl'
    });
}]);

app.controller('TestResultCtrl', ['$scope', '$routeParams', 'TestResult', 'GetChartStructure',
    function ($scope, $routeParams, TestResult, GetChartStructure) {
        // Fix absent scrollbar
        var $body = angular.element('body');
        if ($body.hasClass('modal-open')) {
            $body.removeClass('modal-open');
            $('.modal-backdrop').remove();
        }

        $scope.activeTab = 'steps';
        $scope.setActiveTab = function(tabName) {
            $scope.activeTab = tabName;
        };

        TestResult.get({ testResultId: $routeParams.testResultId}, function (result) {
            try {
                $scope.testResult = JSON.parse(result.failure_reason);
            } catch (error) {
                $scope.failureReason = result.failure_reason;
            }
            $scope.suite = result.suite;
            $scope.name = result.name;
            $scope.duration = result.duration;
            $scope.launch = result.launch;

            $scope.charts = [];
            _.each($scope.testResult.series, function(serie) {
                $scope.charts.push(
                GetChartStructure(
                    'area_absolute',
                    serie.y,
                    [getStruct(serie.name, serie.x)]
                ));
            });
        });

        function getStruct(name, data) {
            return {
                name: name,
                data: data,
                color: '#a5aad9'
            };
        }
    }
]);
