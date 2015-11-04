'use strict';

var spinerApp = angular.module('evaluationchecklistModule', ['monospaced.elastic', 'ui.bootstrap', 'clientServiceREST', 'checklistService', 'templateService', 'industryService', 'clientQuestionService', 'clientemployeeService', 'impressiontypeservice', 'ui.tinymce', 'accountService', 'executiveSummaryService', 'checklistTemplateService', 'questionService']).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/evaluationchecklists', { templateUrl: 'angular/partials/checklists.htm', controller: ChecklistsController }).
            when('/evaluationchecklists/:Id', { templateUrl: 'angular/partials/checklist.htm', controller: ChecklistController }).
            when('/clientsearch', { templateUrl: 'angular/partials/clientsearch.htm', controller: ClientSearchController }).
            when('/clientsearch/:clientAccountNumber', { templateUrl: 'angular/partials/clientsearch.htm', controller: ClientSearchController }).
            when('/createchecklist/:clientAccountNumber/:siteId', { templateUrl: 'angular/partials/createCheckList.htm', controller: CreateChecklistController }).
            when('/reportsummary', { templateUrl: 'angular/partials/reportsummary.htm', controller: ReportSummaryController }).
            when('/executivesummary/:Id', { templateUrl: 'angular/partials/executivesummaryeditor.htm', controller: ExecutiveSummaryController }).
            when('/executivesummary/:Id/:templateId', { templateUrl: 'angular/partials/executivesummaryeditor.htm', controller: ExecutiveSummaryController }).
            when('/localstorage', { templateUrl: 'angular/partials/localstorage.htm', controller: LocalStorageController }).
            otherwise({ redirectTo: '/reportsummary' });
    } ])
    .run(function ($rootScope, $window, $modal, $location, AccountService, ConfigService, ChecklistService) {

        $rootScope.ChecklistLastSuccessfullySavedToServer = null;
        $rootScope.ChecklistLastSavedlocaly = null;
        $rootScope.postChecklistInProgress = false;

        $rootScope.ChecklistLocalVersionIsGreaterThanServerVersion = function() {
            if ($rootScope.ChecklistLastSavedlocaly != null && $rootScope.ChecklistLastSuccessfullySavedToServer != null &&
                                (ParseDate($rootScope.ChecklistLastSavedlocaly).getTime() > ParseDate($rootScope.ChecklistLastSuccessfullySavedToServer).getTime())) {
                return true;
            }
            return false;
        }

    $rootScope.version = ConfigService.getConfig().version;

        $rootScope.workingOffline = {
            status: false
        };        
        
        $rootScope.isOnlineAndWorkingOnline = function (windowObject) {
            var onLine = true;

            if ($rootScope.workingOffline.status)
                return false;

            if (windowObject == null) {
                onLine = $rootScope.online;
            }
            else {
                if (angular.isDefined(windowObject.navigator.onLine)) {
                    onLine = windowObject.navigator.onLine;
                }
            }

            return onLine;
        };
        
        $rootScope.online = isOnline($window);

        $rootScope.blockUI = function () {
            $rootScope.blocked = true;
        };

        $rootScope.unblockUI = function () {
            $rootScope.blocked = false;
        };

        $rootScope.alerts = [];

        $rootScope.closeAlert = function (index) {
            $rootScope.alerts.splice(index, 1);
        };

        $rootScope.blockUI();
        AccountService.get(function (result) {
            $rootScope.user = result;
            $rootScope.unblockUI();
        });

        if ($window.addEventListener != undefined) {
            $window.addEventListener("offline", function () {
                $rootScope.$apply(function () {
                    //  $rootScope.alerts = [{ type: 'error', msg: 'SafeCheck is offline' }];
                    $rootScope.online = false;
                });
            }, false);

            $window.addEventListener("online", function () {
                $rootScope.$apply(function () {
                    // $rootScope.alerts = [{ type: 'success', msg: 'SafeCheck is online' }];
                    $rootScope.online = true;
                });
            }, false);
        }

        $rootScope.appCacheStatus = "";

        function handleCacheEvent(e) {
            var appCache = $window.applicationCache;

            switch (appCache.status) {
                case appCache.UNCACHED: // UNCACHED == 0
                    $rootScope.appCacheStatus = "";
                    break;
                case appCache.IDLE: // IDLE == 1
                    $rootScope.appCacheStatus = "";
                    break;
                case appCache.CHECKING: // CHECKING == 2
                    $rootScope.appCacheStatus = "Checking for update...  ";
                    break;
                case appCache.DOWNLOADING: // DOWNLOADING == 3
                    $rootScope.appCacheStatus = "Downloading update...  ";
                    break;
                case appCache.UPDATEREADY: // UPDATEREADY == 4
                    cacheUpdateReady();
                    break;
                case appCache.OBSOLETE: // OBSOLETE == 5
                    $rootScope.appCacheStatus = "Error downloading application cache";
                    break;
                default:
                    $rootScope.appCacheStatus = "Unknown application cache status";
                    break;
            };
        }

        function cacheUpdateReady() {
            $rootScope.appCacheStatus = "Update ready   ";

            if (confirm('A new version of this site is available. Load it?')) {
                $rootScope.blockUI();
                try {
                    $window.applicationCache.swapCache();
                    $window.location.reload();
                    $rootScope.blockUI();
                } catch (e) {
                    console.log("Error reloading page. " + e);
                    alert("Error reloading page. " + e);
                    $rootScope.unblockUI();
                }
                
            }
        }

        function handleCacheError(e) {
            console.log('Error: Cache failed to update!');
            $rootScope.appCacheStatus = "Error downloading application cache";
            //alert('Error: Cache failed to update!');
        };

        try {
            // Fired after the first cache of the manifest.
            $window.applicationCache.addEventListener('cached', handleCacheEvent, false);

            // Checking for an update. Always the first event fired in the sequence.
            $window.applicationCache.addEventListener('checking', handleCacheEvent, false);

            // An update was found. The browser is fetching resources.
            $window.applicationCache.addEventListener('downloading', handleCacheEvent, false);

            // The manifest returns 404 or 410, the download failed,
            // or the manifest changed while the download was in progress.
            $window.applicationCache.addEventListener('error', handleCacheError, false);

            // Fired after the first download of the manifest.
            $window.applicationCache.addEventListener('noupdate', handleCacheEvent, false);

            // Fired if the manifest file returns a 404 or 410.
            // This results in the application cache being deleted.
            $window.applicationCache.addEventListener('obsolete', handleCacheEvent, false);

            // Fired for each resource listed in the manifest as it is being fetched.
            $window.applicationCache.addEventListener('progress', handleCacheEvent, false);

            // Fired when the manifest resources have been newly redownloaded.
            $window.applicationCache.addEventListener('updateready', handleCacheEvent, false);
        } catch (e) {
            console.log('Error creating event handlers for the application cache');
            console.log(e);
        }
      

        $rootScope.checkForNewVersion = function (windowObject) {
           if (isOnline(windowObject)) {
               try {
                   if (angular.isDefined(windowObject.applicationCache)) {
                       switch (windowObject.applicationCache.status) {
                           case windowObject.applicationCache.IDLE:
                               windowObject.applicationCache.update();
                               break;
                           case windowObject.applicationCache.UPDATEREADY:
                               cacheUpdateReady();
                               break;
                       }

                   }
               } catch (err) {
                   console.log("Error checking for latest version");
                   console.log(err);
               }
           }
        };

        $rootScope.cloneChecklist = function (checklistId) {
            var modalInstance = $modal.open({
                scope: $rootScope,
                templateUrl: 'angular/partials/cloneChecklistPopup.htm',
                controller: CloneChecklistController,
                resolve:
                    {
                    }
            });

            modalInstance.result.then(function (result) {

                if (result.SelectedSiteIDs.length == 0) {
                    return;
                }

                $rootScope.blockUI();
                var promise = ChecklistService.cloneReport(checklistId, result.SelectedSiteIDs, result.ClientId, result.WithResponses);
                promise.then(function (result) {
                    if (result.success) {
                        if (result.data.length == 1) {
                            // Client summary page
                            $location.path("evaluationchecklists/" + result.data[0].ChecklistId);
                        }
                        else {
                            // Report Summary page
                            $location.path("reportsummary/");
                        }
                    }
                    $rootScope.unblockUI();
                });

            },
                function () {
                    //Cancel clicked.
                });
        };

    });

    spinerApp.directive('customdatepicker', function () {

        return {
            require: 'ngModel',
            
            link: function (scope, el, attr, ngModel) {
                var picker = $(el).datepicker({
                    format: "dd/mm/yyyy",
                    autoclose: true
                }).on('changeDate', function (ev) {
                    var day = picker.datepicker('getDate');
                    if (day == null || day == undefined) {
                        return;
                    }
                    scope.$apply(function () {
                        $(el).datepicker("setDate", $(el).datepicker("getDate"));
                        ngModel.$setViewValue(day.toJSON());
                    });
                });

                // Update the date picker when the model changes
                ngModel.$render = function () {
                    var date = ngModel.$viewValue;
                    
                    if (date == "") {
                        date = null;
                        $(el)[0].value = '';
                    }
                    
                    if (angular.isDefined(date) && date != null && date !='') {
                        if (!angular.isDate(date)) {
                            date = ParseDate(date);
                        }

                        if (!angular.isDate(date)) {
                            throw new Error('ng-Model value must be a Date object - currently it is a ' + typeof date + ' -  convert it from a string');
                        }


                        $(el).datepicker("setDate", date);
                    }

                };

                $(el).next().children().click(function () {
                    $(el).datepicker('show');
                });
            }
        };
    });

    spinerApp.factory('$debounce', ['$rootScope', '$browser', '$q', '$exceptionHandler',
            function ($rootScope, $browser, $q, $exceptionHandler) {
                var deferreds = {},
                    methods = {},
                    uuid = 0;

                function debounce(fn, delay, invokeApply) {
                    var deferred = $q.defer(),
                        promise = deferred.promise,
                        skipApply = (angular.isDefined(invokeApply) && !invokeApply),
                        timeoutId, cleanup,
                        methodId, bouncing = false;

                    // check we dont have this method already registered
                    angular.forEach(methods, function (value, key) {
                        if (angular.equals(methods[key].fn, fn)) {
                            bouncing = true;
                            methodId = key;
                        }
                    });

                    // not bouncing, then register new instance
                    if (!bouncing) {
                        methodId = uuid++;
                        methods[methodId] = { fn: fn };
                    } else {
                        // clear the old timeout
                        deferreds[methods[methodId].timeoutId].reject('bounced');
                        $browser.defer.cancel(methods[methodId].timeoutId);
                    }

                    var debounced = function () {
                        // actually executing? clean method bank
                        delete methods[methodId];

                        try {
                            deferred.resolve(fn());
                        } catch (e) {
                            deferred.reject(e);
                            $exceptionHandler(e);
                        }

                        if (!skipApply) $rootScope.$apply();
                    };

                    timeoutId = $browser.defer(debounced, delay);

                    // track id with method
                    methods[methodId].timeoutId = timeoutId;

                    cleanup = function (reason) {
                        delete deferreds[promise.$$timeoutId];
                    };

                    promise.$$timeoutId = timeoutId;
                    deferreds[timeoutId] = deferred;
                    promise.then(cleanup, cleanup);

                    return promise;
                }


                // similar to angular's $timeout cancel
                debounce.cancel = function (promise) {
                    if (promise && promise.$$timeoutId in deferreds) {
                        deferreds[promise.$$timeoutId].reject('canceled');
                        return $browser.defer.cancel(promise.$$timeoutId);
                    }
                    return false;
                };

                return debounce;
            } ]);

angular.module('executiveSummaryPrint', ['clientServiceREST', 'checklistService', 'executiveSummaryService', 'ui.bootstrap', 'clientQuestionService', 'clientemployeeService', 'checklistTemplateService', 'questionService']).
    config([
        '$routeProvider', function($routeProvider) {
            $routeProvider
                .when('/executivesummary/:Id', { templateUrl: 'angular/partials/executivesummaryprint.htm', controller: ExecutiveSummaryController })
                .when('/actionplan/:Id', { templateUrl: 'angular/partials/actionplanprint.htm', controller: ExecutiveSummaryController })
                .otherwise({ redirectTo: '/reportsummary' });
        }
    ]).run(function($rootScope, $window) {

        $rootScope.workingOffline = {
            status: false
        };

        $rootScope.isOnlineAndWorkingOnline = function(windowObject) {
            var onLine = true;

            if (windowObject != null) {
                onLine = isOnline(windowObject);
            }

            return onLine;
        };
    });

angular.module('maintenancetool', ['clientServiceREST', 'checklistService', 'ui.bootstrap', 'clientQuestionService', 'accountService', 'categoryService', 'questionService', 'industryService', 'checklistTemplateService', 'consultantService', 'userService', 'executiveSummaryService']).
    config([
        '$routeProvider', function($routeProvider) {
            $routeProvider
                .when('/maintenance', { templateUrl: 'angular/partials/maintenance/maintenance.htm', controller: MaintenanceController })
                .when('/unauthorised', { templateUrl: 'angular/partials/maintenance/unauthorised.htm' })
                .otherwise({ redirectTo: '/unauthorised' });
        }
    ])
    .run(function($rootScope, $location, $window, AccountService, UserService) {
    UserService.get(function(result) {
        $rootScope.maintenanceUser = result;

        if ($rootScope.maintenanceUser == "null") {
            $location.path("/unauthorised");
        }

    });

    // copied from main spinerApp
    $rootScope.workingOffline = {
        status: false
    };

    $rootScope.isOnlineAndWorkingOnline = function(windowObject) {
        var onLine = true;

        if (windowObject != null) {
            onLine = isOnline(windowObject);
        }

        return onLine;
    };

    $rootScope.online = isOnline($window);

    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        if ($rootScope.maintenanceUser == "null") {
            // no maintenance user, we should be going to unauthorised
            if (next.templateUrl == "unauthorised.htm") {
                // already going to #unauthorised, no redirect needed
            } else {
                // not going to #unauthorised, we should redirect now
                $location.path("/unauthorised");
            }
        }
    });

    AccountService.get(function(result) {
        $rootScope.user = result;
    });

    $rootScope.alerts = [];

    $rootScope.closeAlert = function(index) {
        $rootScope.alerts.splice(index, 1);
    };

   

});

  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
  }

  function guid() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
  }

  function emptyGuid() {
      return "00000000-0000-0000-0000-000000000000";
  }


  function sortByKey(array, key) {
      return array.sort(function(a, b) {
          var x = a[key];
          var y = b[key];
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });
  }

  function IsNullOrUndefined(val) 
  {
      return (val == null || typeof val === 'undefined');          
  }


  Date.prototype.toShortDate = function() {
      return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
  };

  function ParseDate(dateString) {
      //Parses the following formats : 14/12/2013, 2014-01-06T09:48:50, 2014-01-06T09:48:50Z
      if (dateString.length == 10) {
          var year = dateString.slice(6, 10);
          var month = dateString.slice(3, 5) - 1;
          var day = dateString.slice(0, 2);

          return new Date(year, month, day);
      }
      else if (dateString.length == 19) {
          return new Date(dateString += "Z");
      }
      else {
          return new Date(dateString);
      }

      
  }



function isOnline(windowObject){
    var onLine = true;
  
    if (angular.isDefined(windowObject.navigator.onLine)) {
        onLine = windowObject.navigator.onLine;
    }
    return onLine;
}


function isNullOrEmptyString(value) {
    return value == null || value == '';
}

function isValidEmailAddress(emailAddress){
    var pattern = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var valid = angular.isDefined(emailAddress) &&
                !isNullOrEmptyString(emailAddress) &&
                    pattern.test(emailAddress);

    return valid;
};