'use strict';

angular.module('anotherApp')
  .controller('MainCtrl', function ($scope, $routeParams) {
    var config = {
      ip: $routeParams.rhqip || '127.0.0.1',
      show: true,
      counter: 0
    };
    $scope.rhqConfig = config;

    $scope.$on('hostDown', function(event, message) {
      $scope.addAlert('danger', message);
    });
    $scope.alerts = [];
    $scope.addAlert = function(severity, message) {
      $scope.alerts.push({type: severity, msg: message});
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  })

  .directive('metricGraph', function ($parse, $q, $http) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        schedule: '@',
        host: '@',
        opts: '=',
        show: '=',
        raw: '='
      },
      link: function (scope, element) {
        var dataArrived = $q.defer();
        dataArrived.promise.then(function (graphData) {
          scope.graph = new Dygraph(element[0], graphData, scope.opts);
          return graphData.length - 1;
        }).then(function(lastPoint) {
          scope.graph.setSelection(lastPoint);
          scope.$emit('dygraphCreated', element[0].id, scope.graph);
        });
        var endpoint = 'http://' + scope.host +':7080/rest/metric/data/' + scope.schedule + (scope.raw ? '/raw.json' : '.json');
        $http({ 
          method: 'GET',
          timeout: 3000,
          url: endpoint
        }).success(function (data) {
          var filteredData = scope.raw ? data.map(function(x){ return [new Date(x.timeStamp), x.value]; }) 
            : data.dataPoints.map(function(x){ return [new Date(x.timeStamp), x.value, x.low, x.high]; })
          dataArrived.resolve(filteredData);
        }).
        error(function (data, status) {
          console.log('Error - status: ' + status);
          scope.show = false;
          scope.$emit('hostDown', 'Cannot render the chart. URL ' + endpoint);
        });
        var removeInitialDataWatch = scope.$watch('data', function (newValue, oldValue, scope) {
          if ((newValue !== oldValue) && (newValue.length > 0)) {
            dataArrived.resolve(newValue);
            removeInitialDataWatch();
            scope.$watch('data', function (newValue, oldValue, scope) {
              if ((newValue !== oldValue) && (newValue.length > 0)) {
                var selection = scope.graph.getSelection();
                scope.graph.updateOptions({'file': newValue});
                if ((selection >= 0) && (selection < newValue.length)) {
                  scope.graph.setSelection(selection);
                }
              }
            }, true);
            scope.$watch('options', function (newValue, oldValue, scope) {
              if (newValue !== undefined) {
                scope.graph.updateOptions(newValue);
              }
            }, true);
          }
        }, true);
      }
    };
  })

  .factory('restHook', function($rootScope, $window) {
    return {
      request: function(config) {
        config.headers['Access-Control-Allow-Origin'] = '*';
        config.headers['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Methods, Authorization';
        config.headers.Accept = 'application/json';
        config.headers.Authorization = 'Basic ' +  $window.btoa('rhqadmin' + ':' + 'rhqadmin');
        return config;
      }
    };
  })

  .config(function($httpProvider) {
    $httpProvider.interceptors.unshift('restHook');
  });

