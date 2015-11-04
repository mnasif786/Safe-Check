angular.module('executiveSummaryService', [], function ($provide) {
    $provide.factory('ExecutiveSummaryService', function ($q, $filter, QuestionService) {
        var headings = [];
        var _getReportLetterStatementsByCategory = function (questionAnswersArray, reportLetterStatementCategory) {
            var filteredQuestions = $filter('filter')(questionAnswersArray, function (item) {
                return angular.isDefined(item.Answer)
                    && angular.isDefined(item.Answer.Response)
                    && item.Answer.Response != null
                    && item.Answer.Response.ReportLetterStatementCategory == reportLetterStatementCategory
                    && item.Answer.Response.Title != 'Acceptable'
                    && item.Answer.Response.Title != 'Not Applicable';
            });

            var statements = [];

            angular.forEach(filteredQuestions, function (value) {
                if (angular.isDefined(value.Answer.AreaOfNonCompliance) && value.Answer.AreaOfNonCompliance != null && value.Answer.AreaOfNonCompliance.length > 0) {
                    statements.push(value.Answer.AreaOfNonCompliance);
                }
                else {
                    statements.push(value.Answer.Response.ReportLetterStatement);
                }
            });

            return statements;
        };

        var _generateContentForLetterStatementReportCategory = function (checklist, reportLetterStatementCategory) {
            var content = "<p><strong><span style=\"text-decoration: underline;\">" + reportLetterStatementCategory + ":</span></strong>";

            var letterStatements = _getReportLetterStatementsByCategory(checklist.Questions, reportLetterStatementCategory);

            if (letterStatements.length > 0) {
                content += "<ul>";
                angular.forEach(letterStatements, function (value) {
                    content += "<li><span style=\"color: rgb(255, 0, 0);\"'>" + value + "</span></li>"
                });

                content += "</ul>";
            }

            content += "</p>";

            return content;
        };

        var _generateContentForLetterAddress = function (checklist) {
            var content = "";

            content += "<p><span style=\"color: rgb(255, 0, 255);\">[Insert Name]</span>";
            content += "<br/>" + "<span style=\"color: rgb(255, 0, 255);\">[Insert Title]</span>";

            if (checklist.ClientDetails != undefined) {
                content += "<br/>" + checklist.ClientDetails.CompanyName;
            }
            if (checklist.Site !== undefined) {
                content += "<br/>" + checklist.Site.Address1;
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address2);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address3);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address4);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address5);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Postcode);
                content += "</p>";
            }

            content += "<p>Our ref: " + (checklist.ClientDetails != undefined ? checklist.ClientDetails.CAN : "") + "</p>";
            content += "<p data-letter-date><span style=\"color: rgb(215, 215, 215);\">[letter date: auto generated]</span></p>";

            if (checklist.SiteVisit.PersonSeen != undefined && checklist.SiteVisit.PersonSeen != null && checklist.SiteVisit.PersonSeen.Name != undefined && checklist.SiteVisit.PersonSeen.Name != null) {
                content += "<p>Dear " + checklist.SiteVisit.PersonSeen.Name + "</p>";
            } else {
                content += "<p>Dear <span style=\"color: rgb(255, 0, 255);\">[Insert Salutation]</span></p>";
            }

            return content;
        };

        var _generateSpecialReportContentForLetterAddress = function (checklist) {
            var content = "";

            content += "<p><span style=\"color: rgb(225, 0, 0);\">[Recipient’s name]</span>";
            content += "<br/>" + "<span style=\"color: rgb(225, 0, 0);\">[Job Title]</span>";
            
            if (checklist.ClientDetails != undefined) {
                content += "<br/>" + checklist.ClientDetails.CompanyName;
            }
            if (checklist.Site !== undefined) {
                content += "<br/>" + checklist.Site.Address1;
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address2);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address3);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address4);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Address5);
                content += appendLineOfAddressLineIfNotNull("<br/>", checklist.Site.Postcode);
                content += "</p>";
            }

            content += "<p data-letter-date><span style=\"color: rgb(215, 215, 215);\">[letter date: auto generated]</span></p>";
            content += "<p>Our ref: " + (checklist.ClientDetails != undefined ? checklist.ClientDetails.CAN : "") + "</p>";
            

            if (checklist.SiteVisit.PersonSeen != undefined && checklist.SiteVisit.PersonSeen != null && checklist.SiteVisit.PersonSeen.Name != undefined && checklist.SiteVisit.PersonSeen.Name != null) {
                content += "<p>Dear " + checklist.SiteVisit.PersonSeen.Name + "</p>";
            } else {
                content += "<p>Dear <span style=\"color: rgb(0, 0, 255);\">Mr / Mrs / Ms / Miss</span></p>";
            }

            return content;
        };

        var _generateSpecialReportContentForVisitAddress = function (checklist) {

            var content = "";

            content += "<p><strong>Address Visited: </strong><span style=\"color: rgb(0, 0, 225);\"> As Above</span></p>";
            if (checklist.SiteVisit != undefined && checklist.SiteVisit.VisitDate != null) {
                content += "<p><strong>Visit Date:</strong> " + $filter('date')(checklist.SiteVisit.VisitDate, 'dd/MM/yyyy') + "</p>";
            } else {
                content += "<p><strong>Visit Date:</strong> <span style=\"color: rgb(0, 0, 255);\">[Visit Date]</span></p>";
            }

            content += "<p><strong><span style=\"color: rgb(0, 0, 255);\">Accompanied by:</span></strong> <span style=\"color: rgb(255, 0, 255);\"> [Delete if the accompanying person is the same as the letter recipient]</span></p>";

            return content;
        };

        var _generateContentForVisitAddress = function (checklist) {
            var content = "";
            if (checklist.Site != undefined) {
                content += "<p><strong>Address Visited: </strong>";
                content += appendLineOfAddressLineIfNotNull("", checklist.Site.Address1);
                content += appendLineOfAddressLineIfNotNull(", ", checklist.Site.Address2);
                content += appendLineOfAddressLineIfNotNull(", ", checklist.Site.Address3);
                content += appendLineOfAddressLineIfNotNull(", ", checklist.Site.Address4);
                content += appendLineOfAddressLineIfNotNull(", ", checklist.Site.Address5);
                content += appendLineOfAddressLineIfNotNull(", ", checklist.Site.Postcode);
                content += "</p>";
            } else {
                content += "<p><strong>Address Visited: </strong></p>";
            }

            if (checklist.SiteVisit != undefined && checklist.SiteVisit.VisitDate != null) {
                content += "<p>Visit date: " + $filter('date')(checklist.SiteVisit.VisitDate, 'dd/MM/yyyy') + "</p>";
            } else {
                content += "<p>Visit date:<span style=\"color: rgb(0, 0, 255);\">[Visit Date]</span></p>";
            }

            content += "<p><strong><span style=\"color: rgb(0, 0, 255);\">Accompanied by:</span></strong> <span style=\"color: rgb(255, 0, 255);\"> [Removable if the accompanying persons is the same as the letter recipient]</span></p>";
            content += "<p><strong><span style=\"text-decoration: underline;\">Executive Summary:</span></strong></p>";


            return content;
        };

        var _generateContentForOverallImpression = function (checklist) {
            var content = "";

            if (checklist.SiteVisit.SelectedImpressionType != null && checklist.SiteVisit.SelectedImpressionType.Comments != null && checklist.SiteVisit.SelectedImpressionType.Comments != "") {
                content = "<p>" + checklist.SiteVisit.SelectedImpressionType.Comments + "</p>";
            }

            return content;
        };

        var _generateContentForIRNParagraph = function () {
            return "<p><span style=\"color: rgb(0, 0, 255);\">[Removable if not applicable]</span> <span style=\"color: rgb(255, 0, 255);\"><strong> An Immediate Risk Notice (IRN) was issued at the time of the visit which identified a very serious matter requiring immediate action. Please refer to the Action Plan for further information in addition to the IRN I left at the visit.</strong> <span></p>";
        };

        var _generateContentForKeyAreasParagraph = function (checklist) {
            var content = "<p>The following are key areas, where I believe that actions are necessary to help ensure statutory compliance and to help maintain the health, safety and welfare of your employees whilst they are at work. The details are summarised below:</p>";

            angular.forEach(headings, function (heading, key) {
                content += _generateContentForLetterStatementReportCategory(checklist, heading.Name);
            });

            return content;
        };

        var _generateContentFatFaceKeyAreasParagraph = function (checklist) {
            var content = "<p>The following are key areas, where I believe that actions are necessary to help ensure statutory compliance and to help maintain the health, safety and welfare of your crew whilst they are at work. The details are summarised as follows:</p>";

            angular.forEach(headings, function (heading, key) {
                content += _generateContentForLetterStatementReportCategory(checklist, heading.Name);
            });

            return content;
        };

        var _generateContentBannatyneKeyAreasParagraph = function (checklist) {
            var content = "<p>The following are key areas, where I believe that actions are necessary to help ensure statutory compliance and to help maintain the health, safety and welfare of your employees whilst they are at work. The details are summarised below:</p>";

            angular.forEach(headings, function (heading, key) {
                content += _generateContentForLetterStatementReportCategory(checklist, heading.Name);
            });

            return content;
        };

        var _generateContentPoundlandKeyAreasParagraph = function (checklist) {
            var content = "<p style=\"color: rgb(255, 0, 0);\">The Poundworld store in ##### opened in ##/#### and is located in the town / city centre/ retail park. <span style=\"color: rgb(255, 0, 255);\">(Brief description of the store and facilities)</span><p>";
            content += "<p style=\"color: rgb(255, 0, 0);\">The store is fitted out with integral fire alarm and smoke detectors, sprinkler system with emergency lighting installed throughout. <span style=\"color: rgb(255, 0, 255);\">(Delete as applicable)</span></p>";
            content += "<p>The following are key areas, where I believe that actions are necessary to help ensure statutory compliance and to help maintain the health, safety and welfare of your employees whilst they are at work. The details are summarised below:</p>";

            angular.forEach(headings, function (heading, key) {
                content += _generateContentForLetterStatementReportCategory(checklist, heading.Name);
            });

            return content;
        };

        var _generateContentForLetterSignature = function (checklist) {
            //do not put <p> elements in this function the signature should be contained in the same <p> as the last paragraph. This is because when the report is printed the signature shouldn't appear on its own on a seperate page.

            var content = "<br/><br/>Yours sincerely, <br/>";

            if (checklist.PostedBy != undefined) {
                content += "<br/>" + checklist.PostedBy + "<br/>Business Safety Consultant<br/>";
            }
            else {
                content += "<span style=\"color: rgb(0, 0, 255);\"> [Consultants name] </span>";
            }

            if (checklist.PostedByEmailAddress != undefined) {
                content += "<br/>" + checklist.PostedByEmailAddress + "<br/>"; ;
            }
            else {
                content += "<br/><span style=\"color: rgb(0, 0, 255);\"> [Email address] </span>";
            }

            var sentTo = "";
            var emailReportToPersonSet = false;

            if (checklist.EmailReportToPerson && checklist.SiteVisit.PersonSeen != undefined && checklist.SiteVisit.PersonSeen != null && checklist.SiteVisit.PersonSeen.Name != undefined && checklist.SiteVisit.PersonSeen.Name != null) {
                sentTo += " To: " + checklist.SiteVisit.PersonSeen.Name + "(" + checklist.SiteVisit.EmailAddress + ")";
                emailReportToPersonSet = true;
            }

            if (angular.isDefined(checklist.OtherEmails) && checklist.EmailReportToOthers) {
                if (!emailReportToPersonSet) {
                    sentTo += " To: ";
                }

                for (var i = 0; i < checklist.OtherEmails.length; i++) {
                    if (i == 0 && !emailReportToPersonSet) {
                        sentTo += checklist.OtherEmails[i].Name;
                        sentTo += " ("; sentTo += checklist.OtherEmails[i].EmailAddress; sentTo += ")";
                    } else {
                        sentTo += ", ";
                        sentTo += checklist.OtherEmails[i].Name;
                        sentTo += " ("; sentTo += checklist.OtherEmails[i].EmailAddress; sentTo += ")";
                    }
                }
            }

            if (checklist.PostReport) {
                if (sentTo.length) {
                    sentTo += ", ";
                }
                sentTo += " By Post";
            }

            if (sentTo.length) {
                content += "<br/>Sent" + sentTo;
            }

            return content;
        };

        var _generateSpecialReportContentForLetterSignature = function (checklist) {
            //do not put <p> elements in this function the signature should be contained in the same <p> as the last paragraph. This is because when the report is printed the signature shouldn't appear on its own on a seperate page.

            var content = "<br/>Yours sincerely,";

            if (checklist.PostedBy != undefined) {
                content += "<br/>" + checklist.PostedBy + "<br/>Business Safety Consultant<br/>";
            }
            else {
                content += "<br/><span style=\"color: rgb(0, 0, 255);\"> [Consultants name] </span><br/>";
            }

            content += "<span style=\"color: rgb(255, 0, 255);\">Business Safety Consultant</span<<span style=\"color: rgb(0, 0, 255);\"> or title ……………………</span><br/>";

            content += "<br/><span style=\"color: rgb(0, 0, 255);\">Sent by e-mail to:</span>      <span style=\"color: rgb(255, 0, 0);\">[free Text]</span><br/>";

            content += "<br/><span style=\"color: rgb(255, 0, 255);\">And / Or</span><br/>";

            content += "<br/><span style=\"color: rgb(0, 0, 225);\">Sent by post</span><br/>";

            content += "<span style=\"color: rgb(225, 0, 0);\">Cc</span>     <span style=\"color: rgb(255, 0, 225);\">[include postal addresses of copies required and e-mail address]</span><br/>";

            //if (checklist.PostedByEmailAddress != undefined) {
            //    content += "<br/>" + checklist.PostedByEmailAddress + "<br/>";;
            //}
            //else {
            //    content += "<br/><span style=\"color: rgb(0, 0, 255);\"> [Email address] </span>";
            //}

            //var sentTo = "";
            //var emailReportToPersonSet = false;

            //if (checklist.EmailReportToPerson && checklist.SiteVisit.PersonSeen != undefined && checklist.SiteVisit.PersonSeen != null && checklist.SiteVisit.PersonSeen.Name != undefined && checklist.SiteVisit.PersonSeen.Name != null) {
            //    sentTo += " To: " + checklist.SiteVisit.PersonSeen.Name + "(" + checklist.SiteVisit.EmailAddress + ")";
            //    emailReportToPersonSet = true;
            //}

            //if (angular.isDefined(checklist.OtherEmails) && checklist.EmailReportToOthers) {
            //    if (!emailReportToPersonSet) {
            //        sentTo += " To: ";
            //    }

            //    for (var i = 0; i < checklist.OtherEmails.length; i++) {
            //        if (i == 0 && !emailReportToPersonSet) {
            //            sentTo += checklist.OtherEmails[i].Name;
            //            sentTo += " ("; sentTo += checklist.OtherEmails[i].EmailAddress; sentTo += ")";
            //        } else {
            //            sentTo += ", ";
            //            sentTo += checklist.OtherEmails[i].Name;
            //            sentTo += " ("; sentTo += checklist.OtherEmails[i].EmailAddress; sentTo += ")";
            //        }
            //    }
            //}

            //if (checklist.PostReport) {
            //    if (sentTo.length) {
            //        sentTo += ", ";
            //    }
            //    sentTo += " By Post";
            //}

            //if (sentTo.length) {
            //    content += "<br/>Sent" + sentTo;
            //}

            return content;
        };


        var _generateBusinessSafe123Letter = function (checklist) {

            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe 1.2.3 Site Evaluation Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your premises. The report identifies issues relating to health and safety standards that could impact on your business which we discussed during my visit.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings.</span></p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);
            content += "<p>Detailed below is my proposed action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2772 option 2.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateBusinessStandardLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Evaluation Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your premises. The report identifies issues relating to health and safety standards that could impact on your business which we discussed during my visit.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings</span></p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);

            content += "<p>I <span style=\"color: rgb(0, 0, 255);\">explained / reviewed</span> your electronic Safety Management System which includes the following online support tools:</p>";
            content += "<ul><li>Compliance Manager</li>";
            content += "<li>Risk Assessment Wizard</li>";
            content += "<li>Safety Management Documentation</li>";
            content += "<li>Accident Records</li></ul>";

            content += "<p>The use of this electronic part of our service will enhance your ability to manage your health and safety needs and responsibilities and will enable you to effectively delegate tasks to your key employees. The system will electronically store all your key safety related documents and will automatically advise you when certain safety related tasks / actions should be undertaken.</p>";

            content += "<span style=\"color: rgb(255, 0, 255);\">[Operational please remove if not applicable]</span>";
            content += "<span style=\"color: rgb(0, 0, 255);\"> As we agreed, I will revisit you on </span><span style=\"color: rgb(255, 0, 0);\">[date]</span> because <span style=\"color: rgb(255, 0, 0);\">Free text........</span> to <span style=\"color: rgb(255, 0, 0);\">Free text.......</span>";

            content += "<p>Detailed below is my proposed action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2772 option 2.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateBusinessStandardLetterROI = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Healthcheck Service Visit</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>This letter follows my evaluation of your business and premises in relation to health and safety compliance and best practice.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings</span></p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);

            content += "<p>The enclosed Action Plan re-affirms the issues raised during my visit, in particular those which the Enforcing Authorities would consider significant and which could be detrimental to your business and impact on the health, safety and welfare of your employees.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on on 01 855 5050 (option 2).</p>";
            content += "<p>I hope you found my visit useful and I would like to thank you for your time and support during the visit.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateBusinessStandardLetterNI = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Evaluation Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your premises. The report identifies issues relating to health and safety standards that could impact on your business which we discussed during my visit.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings</span></p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);

            content += "<p>I <span style=\"color: rgb(0, 0, 255);\">explained / reviewed</span> your electronic Safety Management System which includes the following online support tools:</p>";
            content += "<ul><li>Compliance Manager</li>";
            content += "<li>Risk Assessment Wizard</li>";
            content += "<li>Safety Management Documentation</li>";
            content += "<li>Accident Records</li></ul>";

            content += "<p>The use of this electronic part of our service will enhance your ability to manage your health and safety needs and responsibilities and will enable you to effectively delegate tasks to your key employees. The system will electronically store all your key safety related documents and will automatically advise you when certain safety related tasks / actions should be undertaken.</p>";

            content += "<span style=\"color: rgb(255, 0, 255);\">[Operational please remove if not applicable]</span>";
            content += "<span style=\"color: rgb(0, 0, 255);\"> As we agreed, I will revisit you on </span><span style=\"color: rgb(255, 0, 0);\">[date]</span> because <span style=\"color: rgb(255, 0, 0);\">Free text........</span> to <span style=\"color: rgb(255, 0, 0);\">Free text.......</span>";

            content += "<p>Detailed below is my proposed action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2772 option 2.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateFatFaceLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Evaluation Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your store. The report identifies issues relating to health and safety standards that could impact on your store which we discussed during my visit.</p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += "<p><strong>Based on the findings of this report this is a red / <span style=\"color: rgb(255, 0, 0);\">amber / green</span> status store</strong></p>";

            content += "<p><span style=\"color: rgb(255, 0, 0);\">The Fat Face store</span><span style=\"color: rgb(255, 0, 255);\"> in ##### opened in ##/#### and is located in the town / city centre. The store occupies a three storey building and is comprised of the retail area on the ground floor with a stockroom, office, crew-room and crew welfare facilities on the first floor. On the second floor there are two additional stockrooms and toilets.</span> </p>";
            content += "<p><span style=\"color: rgb(255, 0, 255);\">The store is fitted out with integral fire alarm and smoke detectors, sprinkler system with emergency lighting installed throughout.</span></p>";
            content += _generateContentFatFaceKeyAreasParagraph(checklist);

            content += "<p>The attached action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2772 option 2.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateBannatyneLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Health and Safety Audit Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your premises. <span style=\"color: rgb(255, 0, 0);\">The purpose of the visit was to carry out a health and safety audit of the fitness club under your management and indicate where any shortfalls and non-compliances have been identified. The findings of the audit will enable you to prioritise your actions, so as to address any matters arising.</span>  The report identifies issues relating to health and safety standards that could impact on your business which we discussed during my visit.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">During the tour I was unable to view the ladies changing room and toilets as these were in use at the time of the visit.</p>";

            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentBannatyneKeyAreasParagraph(checklist);

            content += "<p>I <span style=\"color: rgb(0, 0, 255);\">explained / reviewed</span> your electronic Safety Management System which includes the following online support tools:</p>";
            content += "<ul><li>Responsibility and Task Planner</li><li>Risk Assessment Module</li><li>Safety Management Documentation</li><li>Accident Records</li></ul>";
            content += "<p>The use of this electronic part of our service will enhance your ability to manage your health and safety needs and responsibilities and will enable you to effectively delegate tasks to your key employees. The system will electronically store all your key safety related documents and will automatically advise you when certain safety related tasks / actions should be undertaken.</p>";
            content += "<p>Detailed below is my proposed action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">It was evident that the General Manager has a positive attitude towards achieving continuous improvement in health and safety performance for the business. Certain areas however, can be improved with the implementation of the recommendations contained within this audit report. This should lead to the present standards of health and safety being enhanced further.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 255);\">[Operational please remove if not applicable]</span><span style=\"color: rgb(0, 0, 255);\"> As we agreed, I will revisit you on</span><span style=\"color: rgb(255, 0, 0);\"> [date]</span> because <span style=\"color: rgb(255, 0, 0);\">Free text.......</span> to <span style=\"color: rgb(255, 0, 0);\">Free text.......</span></p>";
            content += "<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2785 option 1.</p>";
            content += "<p>Finally, I would like to thank you and your staff for your co-operation and assistance. I hope that you found the visit useful. I look forward to meeting you again in the future.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateMOTLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe MOT Service Visit</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>This letter follows my evaluation of your business and premises in relation to health and safety compliance and best practice.</p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">Business Description - Free text box for describing the premises and business undertakings</p>";

            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);

            content += "<p>The enclosed Action Plan re-affirms the issues raised during my visit, in particular those which the Enforcing Authorities would consider significant and which could be detrimental to your business and impact on the health, safety and welfare of your employees. </p>";
            content += "<p>Should you require any further support or wish to discuss how we can help you in achieving health and safety compliance, please do not hesitate to contact me or ring our 24 hour Advice Service on 0844 892 2772 (option 2).</p>";
            content += "<p>I hope you found my visit useful and I would like to thank you for your time and support during the visit.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateVinciParkLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: Health & Safety Site Evaluation Visit</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>This letter follows my evaluation of your business and premises in relation to health and safety compliance and best practice.</p>";
            content += "<p>The Health & Safety Site Assessment identifies the areas and subjects I considered to be relevant in evaluating your health and safety management.</p>";
            content += "<p>The Health & Safety Action Plan re-affirms the issues raised during my visit, in particular those which the Enforcing Authorities would consider significant and which could be detrimental to your business and impact on the health, safety and welfare of your employees.</p>";
            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);
            content += _generateContentForKeyAreasParagraph(checklist);

            content += "<p>Should you require any further support or wish to discuss how we can assist you in the future, and what options are available from us, please do not hesitate to contact me on <span style=\"color: rgb(255, 0, 255);\">[Insert Phone Number]</span>";
            content += " or by email to <span style=\"color: rgb(255, 0, 255);\">[Insert Email Address]</span></p>";
            content += "<p>I hope you found my visit useful and I would like to thank you for your time and support during the visit.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };

        var _generateSpacialTemplateLetter = function (checklist) {
            
            var telphoneNumberContents = "";
            if (checklist.Jurisdiction == "NI")
                telphoneNumberContents = "02890 278 900 or 0870 243 9848";
            else if (checklist.Jurisdiction == "ROI") {
                telphoneNumberContents = "01 855 4861 or 01 653 5364.";
            } else {
                telphoneNumberContents = "0844 892 2785 or 0844 892 2772 (option 2).";
            }

            var content = "";
            content += _generateSpecialReportContentForLetterAddress(checklist);
            content += "<p><strong>Re: Business Safety Visit</strong></p>";
            content += _generateSpecialReportContentForVisitAddress(checklist);
            content += "<p>This report follows my visit to your premises in accordance with the terms of our contract for the provision of health and safety services.</p>";
            content += "<p><span style=\"color: rgb(0, 0, 255); \">During my visit I identified that your current Health and Safety Management System needed updating. We therefore agreed that this scheduled Service Visit should concentrate on upgrading your Health and Safety Management System.  Your new system is in preparation and will <span style=\"color: rgb(255, 0, 255);\">[select either]</span> be sent to you shortly <span style=\"color: rgb(255, 0, 255);\">or</span> shortly be available to you in our online system.</span></p>";
            content += "<p style=\"text-align: center;\"><span style=\"color: rgb(255, 0, 255);\">Or</span></p>";
            content += "<p><span style=\"color: rgb(0, 0, 255);\">As you requested specific advice, the time during the visit was spent </span><span style=\"color: rgb(255, 0, 255);\">[free text description of the work done during the visit] ………………………………………………….</span></p>";
            content += "<p  style=\"text-align: center;\"><span style=\"color: rgb(255, 0, 255);\">Or</span></p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">[free text] ……………………………………………………………………………………</span></p>";
            content += "<p><span style=\"color: rgb(225, 0, 255);\">[Delete if not applicable)]</span><br/><span style=\"color: rgb(0, 0, 255);\">You also requested specific assistance to cover the following health and safety concerns, which are now confirmed below.</span></p>";
            content += "<p><span style=\"color: rgb(255, 0, 0);\">[free text] ……………………………………………………………………………………</span></p>";
            content += "<p>Please contact me on <span style=\"color: rgb(255, 0, 0);\">[Consultant’s contact no.]………….</span> or by email to <span style=\"color: rgb(255, 0, 0);\">[Consultant@peninsula-uk.com]…………</span> if anything is unclear.  Should you require advice on any health and safety issue please call our 24 Hour Advice Service on ";
            content += telphoneNumberContents + "</p>";
            content += _generateSpecialReportContentForLetterSignature(checklist);
           
            return content;
        };

        var _generatePoundlandLetter = function (checklist) {
            var content = "";
            content += _generateContentForLetterAddress(checklist);
            content += "<p><strong>Re: BusinessSafe Evaluation Report</strong></p>";
            content += _generateContentForVisitAddress(checklist);
            content += "<p>Please find enclosed my health and safety site evaluation report following my recent visit to your store. The report identifies issues relating to health and safety standards that could impact on your store which we discussed during my visit.</p>";

            content += _generateContentForIRNParagraph();
            content += _generateContentForOverallImpression(checklist);

            content += "<p><strong>Based on the findings of this report this is a red / <span style=\"color: rgb(255, 0, 0);\">amber / green</span> status store</strong></p>";

            content += _generateContentPoundlandKeyAreasParagraph(checklist);

            content += "<p>The attached action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>";              
            content += "<p>The Enforcing Authorities could regard such matters as a ‘material breach’ of legislation which could give rise to formal action being taken by them to ensure compliance.</p>";
            content += "<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>";
            content += "<p>Should you require any further support or wish to discuss how we can assist you in the future, and what options are available from us, please do not hesitate to contact me on <span style=\"color: rgb(255, 0, 255);\">[Insert Phone Number]</span>";
            content += " or by email to <span style=\"color: rgb(255, 0, 255);\">[Insert Email Address]</span> or speak to your Area Manager</p>";
             
         
            content += "<p>I hope you found my visit useful and I would like to thank you for your time and assistance during the visit.";
            content += _generateContentForLetterSignature(checklist);
            content += "</p>";

            return content;
        };


        var appendLineOfAddressLineIfNotNull = function (prefix, lineOfAddress) {
            if (lineOfAddress !== undefined && lineOfAddress != null) {
                return prefix + lineOfAddress;
            } else {
                return "";
            }
        };

        var _templates = [
            {
                "Id": "BusinessSafe123",
                "Title": "GB BusinessSafe 123",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateBusinessSafe123Letter(checklist); }
            },
            {
                "Id": "BusinessSafeStandard",
                "Title": "GB BusinessSafe Standard",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateBusinessStandardLetter(checklist); }
            },

            {
                "Id": "BusinessSafeROI",
                "Title": "ROI BusinessSafe Standard",
                "HeaderType": "ROI",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateBusinessStandardLetterROI(checklist); }
            },
            {
                "Id": "BusinessSafeNI",
                "Title": "NI BusinessSafe Standard",
                "HeaderType": "NI",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateBusinessStandardLetterNI(checklist); }
            },
            {
                "Id": "FatFace",
                "Title": "Fat Face",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": false,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateFatFaceLetter(checklist); }
            },
            {
                "Id": "Bannatyne",
                "Title": "Bannatyne Fitness Limited",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateBannatyneLetter(checklist); }
            },
            {
                "Id": "MOT",
                "Title": "BusinessSafe MOT Service",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateMOTLetter(checklist); }
            },
            {
                "Id": "VinciPark",
                "Title": "Vinci Park",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": "VinciParkLogo.png",
                "IncludeGuidanceNotes": true,
                "SpecialReport": false,
                Generate: function (checklist) { return _generateVinciParkLetter(checklist); }
            },
            {
                "Id": "SpecialReportGB",
                "Title": "GB Special Report",
                "HeaderType": "GB",
                "IncludeActionPlan": false,
                "IncludeComplianceReview": false,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": false,
                "SpecialReport": true,
                Generate: function (checklist) { return _generateSpacialTemplateLetter(checklist); }
            },
            {
                "Id": "SpecialReportROI",
                "Title": "ROI Special Report",
                "HeaderType": "ROI",
                "IncludeActionPlan": false,
                "IncludeComplianceReview": false,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": false,
                "SpecialReport": true,
                Generate: function (checklist) { return _generateSpacialTemplateLetter(checklist); }
            },
            {
                "Id": "SpecialReportNI",
                "Title": "NI Special Report",
                "HeaderType": "NI",
                "IncludeActionPlan": false,
                "IncludeComplianceReview": false,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": false,
                "SpecialReport": true,
                Generate: function (checklist) { return _generateSpacialTemplateLetter(checklist); }
            },
            {
                "Id": "Poundland",
                "Title": "Poundland",
                "HeaderType": "GB",
                "IncludeActionPlan": true,
                "IncludeComplianceReview": true,
                "ClientLogoFilename": null,
                "IncludeGuidanceNotes": true,
		        "SpecialReport": false,
                Generate: function (checklist) { return _generatePoundlandLetter(checklist); }
            }

        ];

        return {
            getTemplates: function () {
                return _templates;
            },

            generateLetter: function (templateId, checklist) {
                var deferred = $q.defer();
                var template = $filter('filter')(_templates, { "Id": templateId });

                if (template.length == 0) {
                    throw "Template with id " + templateId + " not found";
                }

                QuestionService.getHeadings().then(function (result) {
                    if (result.success && result.data.length) {
                        headings = result.data;
                        var resp = { content: template[0].Generate(checklist), clientLogoFilename: template[0].ClientLogoFilename, IncludeGuidanceNotes: template[0].IncludeGuidanceNotes };
                        deferred.resolve(resp);
                    }
                });

                return deferred.promise;
            },

            getReportLetterStatementsByCategory: _getReportLetterStatementsByCategory
        };
    });
});




