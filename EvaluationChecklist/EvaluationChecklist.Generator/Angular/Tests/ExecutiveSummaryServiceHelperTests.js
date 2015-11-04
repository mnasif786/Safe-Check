describe('Executive summary helper tests', function () {

    it('Given executive summary letter contains no html spans when doesExecutiveLetterContainColouredText then return false', function () {
        //given
        var coveringLetterContent = "<p>Mrs&nbsp;Jacqueline McCormickOffice Manager</p>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains no coloured text when doesExecutiveLetterContainColouredText then return false', function () {
        //t
        var coveringLetterContent = "<p><span style=\"color: #000000;\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains coloured text when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: #000000;\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #00200A;\">Office Manager</p><span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(true);
    });

    xit('Given executive summary letter contains coloured spans with no space in style markup when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: #000000;\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color:#00200A;\">Office Manager</p><span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(true);
    });

    it('Given executive summary letter contains letter date place holder and no coloured text spans with no space in style markup when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: #000000;\">Mrs&nbsp;Jacqueline McCormick</span><span style=\"color: #000000;\">Office Manager</span></p>";
        coveringLetterContent += "<p data-letter-date=\"\"><span style=\"color: #d7d7d7;\">[letter date: auto generated]</span></p>";
        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains coloured text using RGB values when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(255, 255, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(true);
    });

    it('Given executive summary letter contains black text using RGB values when doesExecutiveLetterContainColouredText then return false', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(0, 0, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains white background using RGB values when doesExecutiveLetterContainColouredText then return false', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(0, 0, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";
        coveringLetterContent += "<span style=\"background-color: rgb(255, 255, 255);\">text</span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains a white background using HEX values when doesExecutiveLetterContainColouredText then return false', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(0, 0, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";
        coveringLetterContent += "<span style=\"background-color: #FFFFFF;\">text</span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(false);
    });

    it('Given executive summary letter contains a non white background using RGB values when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(0, 0, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";
        coveringLetterContent += "<span style=\"background-color: rgb(255, 150, 255);\">text</span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(true);
    });

    it('Given executive summary letter contains a non white background using HEX values when doesExecutiveLetterContainColouredText then return true', function () {
        //given
        var coveringLetterContent = "<p><span style=\"color: rgb(0, 0, 0);\">Mrs&nbsp;Jacqueline McCormick<span><span style=\"color: #000000;\">Office Manager</p><span>";
        coveringLetterContent += "<span style=\"background-color: #000A00;\">text</span>";

        //when
        var result = executiveSummaryHelper.doesExecutiveLetterContainColouredText(coveringLetterContent);

        //then
        expect(result).toBe(true);
    });


    //<p data-letter-date=""><span style="color: #d7d7d7;" data-mce-style="color: #d7d7d7;">[letter date: auto generated]</span></p>

});

//"<p><span style=\"color: #000000;\">Mrs&nbsp;Jacqueline McCormick</span><br /><span style=\"color: #000000;\">Office Manager</span><br />BookaBuffet.com Limited<br />Block 1<br />1501 Nitshill Rd<br />Thornliebank Industrial Estate<br />Glasgow<br />G46 8QG</p>\n<p>Our ref: BOO050</p>\n<p data-letter-date=\"\"><span style=\"color: #d7d7d7;\">[letter date: auto generated]</span></p>\n<p>Dear Jacqueline</p>\n<p><strong>Re: BusinessSafe Evaluation Report</strong></p>\n<p><strong>Address Visited: </strong>Block 1, 1501 Nitshill Rd, Thornliebank Ind Est, G46 8QG</p>\n<p>Visit date: 03/04/2014</p>\n<p><strong><span style=\"text-decoration: underline;\">Executive Summary:</span></strong></p>\n<p>Please find enclosed my health and safety site evaluation report following my recent visit to your premises. The report identifies issues relating to health and safety standards that could impact on your business which we discussed during my visit.</p>\n<p><span style=\"color: #000000;\">BookaBuffet.com provides high quality catering to corporate and private clients. The company operates from single storey owned premises within Thornliebank Industrial Estate in Glasgow. The premises comprise of front offices, employee changing and toilet facilities, large industrial size kitchen and bakery, dispatch area including office, storage/mezzanine and loading bay.</span></p>\n<p>The overall standard of health and safety management appeared to be satisfactory although it was identified that early action is necessary to improve safety management at this site. By implementing the recommendations contained within the Action Plan, your present standards of health and safety will be enhanced.</p>\n<p><span style='page-break-after:always '></span>The following are key areas, where I believe that actions are necessary to help ensure statutory compliance and to help maintain the health, safety and welfare of your employees whilst they are at work. The details are summarised below:</p>\n<p><strong><span style=\"text-decoration: underline;\">Documentation:</span></strong></p>\n<ul>\n<li><span style=\"color: #000000;\">Currently management monitoring of health and safety actions is not being reviewed quarterly.</span></li>\n<li><span style=\"color: #000000;\">Health and safety consultation arrangements&nbsp;are not currently&nbsp;documented.</span></li>\n</ul>\n<p><strong><span style=\"text-decoration: underline;\">Work Premises:</span></strong></p>\n<ul>\n<li><span style=\"color: #000000;\">Mezzanine floor areas are not managed, checked, maintained and risk assessed.</span></li>\n<li><span style=\"color: #000000;\">There is storage within the electrical switchgear area&nbsp;and there is no suitable rubber matting or shock poster displayed.</span></li>\n</ul>\n<p><strong><span style=\"text-decoration: underline;\">Risk Management:</span></strong></p>\n<ul>\n<li><span style=\"color: #000000;\">Risk assessment of general work tasks, Display Screen Equipment use, hazardous substances use, manual handling activities, young persons and lone working of drivers are not in place.</span></li>\n</ul>\n<p>I <span style=\"color: #000000;\">explained </span>your electronic Safety Management System which includes the following online support tools:</p>\n<ul>\n<li>Compliance Manager</li>\n<li>Risk Assessment Wizard</li>\n<li>Safety Management Documentation</li>\n<li>Accident Records</li>\n</ul>\n<p>The use of this electronic part of our service will enhance your ability to manage your health and safety needs and responsibilities and will enable you to effectively delegate tasks to your key employees. The system will electronically store all your key safety related documents and will automatically advise you when certain safety related tasks / actions should be undertaken.</p>\n<p>Detailed below is my proposed action plan which details the issues discussed during my visit, and in particular those which fall short of legal compliance and current recommended best practice and provides guidance for you to enable you to address the matters raised.</p>\n<p>The Enforcing Authorities could regard such matters as a &lsquo;material breach&rsquo; of legislation which could give rise to formal action being taken by them to ensure compliance.</p>\n<p>I have also included a Health and Safety Compliance Review which comprises of a detailed overview of your current health and safety rating using a traffic light system.</p>\n<p>Should you require any further support or wish to discuss how we can further assist you in achieving health and safety compliance, please do not hesitate to contact me <span style=\"color: #000000;\">on 07875 577 810</span>&nbsp;or ring our 24 hour Advice Service on 0844 892 2772 option 2.<br /><br />Yours sincerely, <br /><br />Michael Moran<br />Business Safety Consultant<br /><br />Michael.Moran@peninsula-uk.com<br /><br />Sent To: Jacqueline McCormick(jacqueline@itsallfood.co.uk)</p>",