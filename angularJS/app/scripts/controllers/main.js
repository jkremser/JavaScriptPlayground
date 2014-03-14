'use strict';

angular.module('anotherApp')
  .controller('MainCtrl', function ($scope, $http) {
    var config = {
      ip: '127.0.0.1'
    }
    $scope.rhqConfig = config;
  })

  .directive('graph', function ($parse, $q, $http) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
              schedule: '@',
              host: '@',
              opts: '='
             },
      link: function (scope, element, attrs) {
        var dataArrived = $q.defer();
        dataArrived.promise.then(function (graphData) {
          scope.graph = new Dygraph(element[0], graphData, scope.opts);
          return graphData.length - 1;
        }).then(function(lastPoint) {
          scope.graph.setSelection(lastPoint);
          scope.$emit('dygraphCreated', element[0].id, scope.graph);
        });
        $http({ method: 'GET', url: 'http://' + scope.host +':7080/rest/metric/data/' + scope.schedule +'/raw.json' }).
          success(function (data, status, headers, config) {
            var filteredData = data.map(function(x){ return [new Date(x.timeStamp), x.value]; });
            dataArrived.resolve(filteredData);
          }).
          error(function (data, status, headers, config) {
            console.log('Error - status: ' + status);
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

