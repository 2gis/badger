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

app.controller('TestResultCtrl', ['$scope', '$routeParams', 'TestResult',
    function ($scope, $routeParams, TestResult) {
        // Fix absent scrollbar
        var $body = angular.element('body');
        if ($body.hasClass('modal-open')) {
            $body.removeClass('modal-open');
            $('.modal-backdrop').remove();
        }

        TestResult.get({ testResultId: $routeParams.testResultId}, function (result) {
            $scope.suite = result.suite;
            $scope.name = result.name;
            $scope.duration = result.duration;
            $scope.failureReason = result.failure_reason;
            $scope.launch = result.launch;
        });
    }
]);
