describe('Report summary controller tests', function() {
    var $httpBackend, $rootScope, createController, mockChecklistService, accountService, $position, configService, $filter;

    //mock local Storage
    var createLocalStorageMock = function() {
        return MockFactory.createLocalStorageMock();
    };

    beforeEach(function() {
        module('accountService');
        module('ui.bootstrap.modal');
        module('clientQuestionService');
        module('clientServiceREST');

    });

    beforeEach(inject(function($injector) {

        $rootScope = $injector.get('$rootScope');
        $rootScope.blockUI = function() {
        };
        $rootScope.unblockUI = function() {
        };
        $rootScope.user = new User('', '', '');
        $rootScope.user.role = 'Consultant';
        $rootScope.checkForNewVersion = function() {
        };

        $rootScope.online = true;
        $rootScope.isOnlineAndWorkingOnline = function() { return this.online; };

        var $controller = $injector.get('$controller');

        configService = $injector.get('ConfigService');
        config = configService.getConfig();

        mockChecklistService = {
            getFromServer: function(checklistId, isDownload, callback) {
                var result = { success: true };
                callback(result);
            },
            query: function(can, consultant, visitDate, status, deleted, excludeSubmitted, statusFromDate, statusToDate, callback) {
                var result = [];
                callback(result);
            },
            uploadLocalChecklistAndRemove: function(checklistId) {
                return {
                    then: function(callback) {
                        var result = {
                            "success": true
                        };
                        callback(result);
                    }
                }
            },
            saveToLocalStorage: function(checklist) {
            },
            getDraftsFromLocalStorage: function() {
            },
            deleteChecklistFromLocalStorage: function(checklistId) {
            },
        };

        accountService = $injector.get('AccountService');
        accountService.get = function(callback) {
        };

        $httpBackend = $injector.get('$httpBackend');
        $filter = $injector.get('$filter');
        $httpBackend.whenGET(config.apiUrl + 'advisors').respond([]);
        $httpBackend.whenGET('/account').respond([]);

        windowMock = MockFactory.createWindowMock();

        createController = function() {
            var controller = $controller('ReportSummaryController', {
                '$rootScope': $rootScope,
                '$scope': $rootScope,
                '$location': null,
                '$timeout': null,
                'AccountService': accountService,
                'ChecklistService': mockChecklistService,
                '$filter': null,
                '$position': $position,
                '$modal': null,
                'ConfigService': configService,
                '$window': windowMock,
                '$filter': $filter
            });
            return controller;
        };
    }));

    var createSearchResultItem = function() {
        return {
            "Id": "21084ac4-b531-0f20-1b33-3029a61ed0cf",
            "Title": "Title",
            "Status": "Assigned",
            "HasQaComments": true,
            "HasUnresolvedQaComments": false,
            "ClientName": "",
            "CAN": "FAT04",
            "QaAdvisor": null,
            "ExecutiveSummaryDocumentLibraryId": null,
            "HasQaComments": false,
            "Deleted": false,
            "HasUnresolvedQaComments": false,
            "Local": false
        }
    }

    it("Given checklist id when download checklist then service is called with correct parameter", function() {
        // given
        var controller = createController();
        var checklistId = 1234;
        spyOn(mockChecklistService, "getFromServer");
        //when
        $rootScope.downloadChecklist(checklistId);
        //then
        expect(mockChecklistService.getFromServer).toHaveBeenCalled();
    });

    it("Given checklistid when download checklist then blockUI is called", function() {
        var controller = createController();
        var checklistId = 1234;
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond([]);
        spyOn($rootScope, "blockUI");
        //when
        $rootScope.downloadChecklist(checklistId);
        //then
        expect($rootScope.blockUI).toHaveBeenCalled();
    });

    it("Given checklistid when download checklist then unblockUI is called", function() {
        var controller = createController();
        var checklistId = 1234;
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond([]);
        spyOn($rootScope, "unblockUI");
        //when
        $rootScope.downloadChecklist(checklistId);
        //then
        expect($rootScope.unblockUI).toHaveBeenCalled();
    });

    it("Given checklistid when upload checklist then blockUI is called", function() {
        var controller = createController();
        var checklistId = 1234;
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond([]);
        spyOn($rootScope, "blockUI");
        //when
        $rootScope.uploadLocalChecklistToServer(checklistId);
        //then
        expect($rootScope.blockUI).toHaveBeenCalled();
    });

    it("Given checklistid when upload checklist then unblockUI is called", function() {
        var controller = createController();
        var checklistId = 1234;
        $httpBackend.whenGET(config.apiUrl + 'checklists/' + checklistId).respond([]);
        spyOn($rootScope, "unblockUI");
        //when
        $rootScope.uploadLocalChecklistToServer(checklistId);
        //then
        expect($rootScope.unblockUI).toHaveBeenCalled();
    });

    it("Given checklistitem has no QA Comments when qaStatusOrder then returns 0", function() {
        //GIVEN
        var controller = createController();
        var searchResultItem = createSearchResultItem();
        searchResultItem.HasQaComments = false;
        searchResultItem.HasUnresolvedQaComments = false;

        //WHEN
        var result = $rootScope.qaStatusOrder(searchResultItem);

        //THEN
        expect(result).toBe(0);
    });

    it("Given checklistitem has unresolved QA Comments when qaStatusOrder then returns 1", function() {
        //GIVEN
        var controller = createController();
        var searchResultItem = createSearchResultItem();
        searchResultItem.HasQaComments = true;
        searchResultItem.HasUnresolvedQaComments = true;

        //WHEN
        var result = $rootScope.qaStatusOrder(searchResultItem);

        //THEN
        expect(result).toBe(1);
    });

    it("Given checklistitem with resolved QA Comments when qaStatusOrder then returns 2", function() {
        //GIVEN
        var controller = createController();
        var searchResultItem = createSearchResultItem();
        searchResultItem.HasQaComments = true;
        searchResultItem.HasUnresolvedQaComments = false;

        //WHEN
        var result = $rootScope.qaStatusOrder(searchResultItem);

        //THEN
        expect(result).toBe(2);
    });

    it('Given checklist with draft status when get status date then result returns created date', function() {

    });

    it('Given locally stored checklist when offline when searchResultItemVisible then return true', function() {
        //given
        windowMock.navigator.onLine = false;
        var searchResultItem = createSearchResultItem();
        searchResultItem.Local = true;

        $rootScope.online = false;


        var controller = createController();

        //WHEN
        var result = $rootScope.searchResultItemVisible(searchResultItem);

        //THEN
        expect(result).toBe(true);

    });

    it('Given locally stored checklist when online when searchResultItemVisible then return true', function() {
        //given
        windowMock.navigator.onLine = true;
        var searchResultItem = createSearchResultItem();
        searchResultItem.Local = true;


        var controller = createController();

        //WHEN
        var result = $rootScope.searchResultItemVisible(searchResultItem);

        //THEN
        expect(result).toBe(true);

    });

    it('Given server checklist when offline when searchResultItemVisible then return false', function() {
        //given
        windowMock.navigator.onLine = false;
        var searchResultItem = createSearchResultItem();
        searchResultItem.Local = false;

        $rootScope.online = false;

        var controller = createController();

        //WHEN
        var result = $rootScope.searchResultItemVisible(searchResultItem);

        //THEN
        expect(result).toBe(false);

    });

    it('Given server checklist when online when searchResultItemVisible then return true', function() {
        //given
        windowMock.navigator.onLine = true;
        var searchResultItem = createSearchResultItem();
        searchResultItem.Local = false;


        var controller = createController();

        //WHEN
        var result = $rootScope.searchResultItemVisible(searchResultItem);

        //THEN
        expect(result).toBe(true);
    });

    it('Given Draft checklist when get status date result returns created date', function() {
        //given

        var item =
        {
            "Id": "942508ea-cf5f-b193-033a-391e44d2fdd0",
            "CreatedOn": "2014-01-09T16:28:57",
            "CompletedOn": "2014-02-09T16:28:57",
            "SubmittedOn": "2014-03-09T16:28:57",
            "UpdatedOn": "2014-05-09T16:28:57",
            "QaAdvisorAssignedOn": "2014-06-09T16:28:57",
            "Status": "Draft",
            "Deleted": false
        };

        var controller = createController();

        //when
        var result = $rootScope.getStatusDate(item);
        expect(result).toBeDefined();
        expect(result).toBe(item.CreatedOn);
    });

    it('Given Assigned checklist when get status date result returns Assigned date', function() {
        //given

        var item =
        {
            "Id": "942508ea-cf5f-b193-033a-391e44d2fdd0",
            "CreatedOn": "2014-01-09T16:28:57",
            "CompletedOn": "2014-02-09T16:28:57",
            "SubmittedOn": "2014-03-09T16:28:57",
            "UpdatedOn": "2014-05-09T16:28:57",
            "QaAdvisorAssignedOn": "2014-06-09T16:28:57",
            "Status": "Assigned",
            "Deleted": false
        };


        var controller = createController();

        //when
        var result = $rootScope.getStatusDate(item);

        expect(result).toBeDefined();
        expect(result).toBe(item.QaAdvisorAssignedOn);
    });

    it('Given Completed checklist when get status date result returns Completed date', function() {
        //given

        var item =
        {
            "Id": "942508ea-cf5f-b193-033a-391e44d2fdd0",
            "CreatedOn": "2014-01-09T16:28:57",
            "CompletedOn": "2014-02-09T16:28:57",
            "SubmittedOn": "2014-03-09T16:28:57",
            "UpdatedOn": "2014-05-09T16:28:57",
            "QaAdvisorAssignedOn": "2014-06-09T16:28:57",
            "Status": "Completed",
            "Deleted": false
        };


        var controller = createController();

        //when
        var result = $rootScope.getStatusDate(item);

        expect(result).toBeDefined();
        expect(result).toBe(item.CompletedOn);
    });

    it('Given Submitted checklist when get status date result returns Completed date', function() {
        //given

        var item =
        {
            "Id": "942508ea-cf5f-b193-033a-391e44d2fdd0",
            "CreatedOn": "2014-01-09T16:28:57",
            "CompletedOn": "2014-02-09T16:28:57",
            "SubmittedOn": "2014-03-09T16:28:57",
            "UpdatedOn": "2014-05-09T16:28:57",
            "QaAdvisorAssignedOn": "2014-06-09T16:28:57",
            "Status": "Submitted",
            "Deleted": false
        };


        var controller = createController();

        //when
        var result = $rootScope.getStatusDate(item);

        expect(result).toBeDefined();
        expect(result).toBe(item.SubmittedOn);
    });

    it('Given Deleted checklist when get status date result returns Last Updated date', function() {
        //given

        var item =
        {
            "Id": "942508ea-cf5f-b193-033a-391e44d2fdd0",
            "CreatedOn": "2014-01-09T16:28:57",
            "CompletedOn": "2014-02-09T16:28:57",
            "SubmittedOn": "2014-03-09T16:28:57",
            "UpdatedOn": "2014-05-09T16:28:57",
            "QaAdvisorAssignedOn": "2014-06-09T16:28:57",
            "Status": "Submitted",
            "Deleted": true
        };


        var controller = createController();

        //when
        var result = $rootScope.getStatusDate(item);

        expect(result).toBeDefined();
        expect(result).toBe(item.UpdatedOn);
    });

    it('Given checklist calculate correct days to submit target date', function () {
        // given
        var visitDate = new Date("2014-06-16T16:28:58");
        var visitDate1 = new Date("2014-06-24T18:28:57");    
        var visitDate2 = new Date("2014-07-08T16:28:57");

        var currentDate = new Date("2014-06-18T16:28:57");
        var currentDate1 = new Date("2014-07-06T16:28:57");
        var currentDate2 = new Date("2014-07-26T16:28:57");
        
        var submittedDate = new Date("2014-07-01T16:28:57");
        var submittedDate1 = new Date("2014-07-26T16:28:57");

        var controller = createController();
        
        //when
        var result = $rootScope.getSubmitToClientTargetDays(visitDate, currentDate);
        var result1 = $rootScope.getSubmitToClientTargetDays(visitDate1, currentDate1);
        var result2 = $rootScope.getSubmitToClientTargetDays(visitDate2, currentDate2);
        var result3 = $rootScope.getSubmitToClientTargetDays(visitDate1, submittedDate);
        var result4 = $rootScope.getSubmitToClientTargetDays(visitDate2, submittedDate1);

        //Then
        expect(result).toBe(13); // 13 days to go
        expect(result1).toBe(3); // 3 days to go
        expect(result2).toBe(-4); // 4 days over
        expect(result3).toBe(8); // submitted with 8 days to go
        expect(result4).toBe(-4); // submitted 4 days overdue
    });

    it('Given checklist without visit date then SLA date should not be set', function() 
    {
        var visitDate = null;
        var currentDate = new Date("2014-03-23T12:34:56");
        
        var controller = createController();
        
        //when
        var result = $rootScope.getSubmitToClientTargetDays(visitDate, currentDate);
     
        //Then
        expect(result).toBe(null);              
    });
    
     it('Given checklist with undefined visit date  then SLA date should be empty', function () {
         // given
        var controller = createController(); // creates rootscope
       
        var daysToTargetDateNull = null;

        var status = 'Draft';

        //when
        var result = $rootScope.getSLAStatusText(daysToTargetDateNull, status);

        // Then
        expect(result).toBe('');       
    });
    
    it('Given checklist calculate SLA date from visit date and status', function () {
         // given
        var controller = createController();

        var daysToTargetDate = 12;
        var daysToTargetDate1 = 2;
        var daysToTargetDate2 = -4;
        var daysToTargetDateNull = null;

        var status = 'Draft';
        var status1 = 'Submitted';
        var status2 = 'Deleted';

        //when
        var result = $rootScope.getSLAStatusText(daysToTargetDate, status);
        var result1 = $rootScope.getSLAStatusText(daysToTargetDate1, status);
        var result2 = $rootScope.getSLAStatusText(daysToTargetDate2, status);
        var result3 = $rootScope.getSLAStatusText(daysToTargetDate, status1);
        var result4 = $rootScope.getSLAStatusText(daysToTargetDate1, status1);
        var result5 = $rootScope.getSLAStatusText(daysToTargetDate2, status1);
        var result6 = $rootScope.getSLAStatusText(daysToTargetDate2, status2);
        var result7 = $rootScope.getSLAStatusText(daysToTargetDateNull, status2);

        // Then
        expect(result).toBe('<span style=\"color: rgb(76, 153, 0);\">12 Days to Client</span>');
        expect(result1).toBe('<span style=\"color: rgb(255, 165, 0);\">2 Days to Client</span>');
        expect(result2).toBe('<span style=\"color: rgb(255, 0, 0);\">4 Days Overdue</span>');
        expect(result3).toBe('<span>In SLA</span>');
        expect(result4).toBe('<span>In SLA</span>');
        expect(result5).toBe('<span>Overdue</span>');
        expect(result6).toBe('');
    });
         
});
