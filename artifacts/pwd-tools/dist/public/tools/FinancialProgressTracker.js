        function formatDateToDDMMYYYY(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        window.onload = function () {
            const startDate = new Date('2023-09-24');
            const endDate = new Date('2025-03-23');
            const reviewDate = new Date('2025-03-08');

            document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            document.getElementById('reviewDate').value = reviewDate.toISOString().split('T')[0];

            const today = new Date();
            const minDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
            const maxDate = new Date(today.getFullYear() + 10, today.getMonth(), today.getDate());

            const minDateStr = minDate.toISOString().split('T')[0];
            const maxDateStr = maxDate.toISOString().split('T')[0];

            document.getElementById('startDate').min = minDateStr;
            document.getElementById('startDate').max = maxDateStr;
            document.getElementById('endDate').min = minDateStr;
            document.getElementById('endDate').max = maxDateStr;
            document.getElementById('reviewDate').min = minDateStr;
            document.getElementById('reviewDate').max = maxDateStr;
        };

        function showDetailedCalculation() {
            const detailedCalculationDiv = document.getElementById("detailedCalculation");
            detailedCalculationDiv.style.display = detailedCalculationDiv.style.display === "block" ? "none" : "block";
        }

        function printAbstract() {
            // Check if calculation has been performed
            const resultsDiv = document.getElementById("results");
            if (resultsDiv.style.display !== "block") {
                alert("Please calculate results first before printing.");
                return;
            }

            // Populate all print fields with current calculated values
            const workOrderAmount = document.getElementById("workOrderAmount").value;
            const startDateValue = document.getElementById("startDate").value;
            const endDateValue = document.getElementById("endDate").value;
            const reviewDateValue = document.getElementById("reviewDate").value;
            const actualProgressInput = document.getElementById("actualProgressInput").value;

            // Get calculated values
            const requiredProgress = document.getElementById("requiredProgress").textContent;
            const actualProgress = document.getElementById("actualProgressResult").textContent;
            const unexecutedWork = document.getElementById("unexecutedWork").textContent;
            const penalty = document.getElementById("penalty").textContent;
            const displayStartDate = formatDateToDDMMYYYY(startDateValue);
            const displayEndDate = formatDateToDDMMYYYY(endDateValue);
            const displayReviewDate = formatDateToDDMMYYYY(reviewDateValue);

            // Populate print fields
            document.getElementById("printWorkOrderAmount").textContent = "₹" + parseFloat(workOrderAmount).toLocaleString('en-IN');
            document.getElementById("printStartDate").textContent = displayStartDate;
            document.getElementById("printEndDate").textContent = displayEndDate;
            document.getElementById("printReviewDate").textContent = displayReviewDate;
            document.getElementById("printActualProgress").textContent = "₹" + parseFloat(actualProgressInput).toLocaleString('en-IN');
            document.getElementById("printRequiredProgress").textContent = "₹" + requiredProgress;
            document.getElementById("printUnexecutedWork").textContent = "₹" + unexecutedWork;
            document.getElementById("printPenalty").textContent = "₹" + penalty;

            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            const printContent = document.getElementById('printAbstractArea').innerHTML;

            printWindow.document.write(`
                <html>
                <head>
                    <title>Financial Progress Tracker - Print</title>
                    <style>
                        @page { margin: 0; }
                        body {
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 12pt;
                            line-height: 1.4;
                            padding: 20px;
                        }
                        h1 {
                            font-size: 18pt;
                            margin-bottom: 15pt;
                            text-align: center;
                            color: #000;
                        }
                        h2 {
                            font-size: 14pt;
                            margin-bottom: 10pt;
                            text-align: center;
                            color: #000;
                        }
                        div {
                            margin-bottom: 8pt;
                        }
                        label {
                            font-weight: bold;
                            font-size: 12pt;
                        }
                        div div {
                            font-size: 12pt;
                            text-align: right;
                            margin-top: 4px;
                        }
                        #printReviewDate {
                            font-weight: bold;
                            text-decoration: underline;
                        }
                        p {
                            font-size: 10pt;
                            text-align: center;
                            margin-top: 15pt;
                        }
                        .hindi {
                            font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif;
                            color: #2c3e50;
                            margin-top: 4px;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            // Trigger print after a short delay to ensure content is loaded
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        function printDetailed() {
            // Check if calculation has been performed
            const resultsDiv = document.getElementById("results");
            if (resultsDiv.style.display !== "block") {
                alert("Please calculate results first before printing.");
                return;
            }

            // Populate detailed calculation for print
            const calculationSteps = document.getElementById("calculationSteps").innerHTML;
            document.getElementById("calculationStepsPrint").innerHTML = calculationSteps;

            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            const printContent = document.getElementById('printDetailedArea').innerHTML;

            printWindow.document.write(`
                <html>
                <head>
                    <title>Financial Progress Tracker - Print</title>
                    <style>
                        body {
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 12pt;
                            line-height: 1.4;
                            padding: 20px;
                        }
                        h1 {
                            font-size: 18pt;
                            margin-bottom: 15pt;
                            text-align: center;
                            color: #000;
                        }
                        h2 {
                            font-size: 14pt;
                            margin-bottom: 10pt;
                            text-align: center;
                            color: #000;
                        }
                        h3 {
                            font-size: 14pt;
                            margin-bottom: 10pt;
                            color: #000;
                        }
                        .calculation-step {
                            page-break-inside: avoid;
                            margin-bottom: 10pt;
                            padding: 8pt;
                            background-color: #f9f9f9;
                            border: 1px solid #ddd;
                            border-radius: 5pt;
                        }
                        .calculation-step h4 {
                            font-size: 12pt;
                            margin-bottom: 5pt;
                            color: #337ab7;
                        }
                        .calculation-step p {
                            font-size: 10pt;
                            margin: 2pt 0;
                        }
                        .highlight { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 2px 4px; font-weight: bold; }
                        #printReviewDate { font-weight: bold; text-decoration: underline; }
                        .hindi {
                            font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif;
                            color: #2c3e50;
                            margin-top: 4px;
                            font-size: 14px;
                        }
                        p {
                            font-size: 10pt;
                            text-align: center;
                            margin-top: 15pt;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            // Trigger print after a short delay to ensure content is loaded
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        function calculate() {
            const workOrderAmount = parseFloat(document.getElementById("workOrderAmount").value);
            const startDateValue = document.getElementById("startDate").value;
            const endDateValue = document.getElementById("endDate").value;
            const reviewDateValue = document.getElementById("reviewDate").value;
            const actualProgressInr = parseFloat(document.getElementById("actualProgressInput").value);

            const errorMessages = document.getElementById("errorMessages");
            const resultsDiv = document.getElementById("results");
            const successDiv = document.getElementById("successMessages");
            const calculationStepsDiv = document.getElementById("calculationSteps");
            const calculationStepsPrintDiv = document.getElementById("calculationStepsPrint");

            errorMessages.innerHTML = "";
            resultsDiv.style.display = "none";
            successDiv.style.display = "none";
            calculationStepsDiv.innerHTML = "";
            calculationStepsPrintDiv.innerHTML = "";

            const startDate = new Date(startDateValue);
            const endDate = new Date(endDateValue);
            const reviewDate = new Date(reviewDateValue);

            if (isNaN(workOrderAmount) || workOrderAmount <= 0) {
                errorMessages.innerHTML = "Error: Please enter a valid Work Order Amount.";
                errorMessages.style.display = "block";
                return;
            }

            if (!startDateValue || isNaN(startDate.getTime())) {
                errorMessages.innerHTML = "Error: Please enter a valid Start Date.";
                errorMessages.style.display = "block";
                return;
            }

            if (!endDateValue || isNaN(endDate.getTime())) {
                errorMessages.innerHTML = "Error: Please enter a valid Completion Date.";
                errorMessages.style.display = "block";
                return;
            }

            if (!reviewDateValue || isNaN(reviewDate.getTime())) {
                errorMessages.innerHTML = "Error: Please enter a valid Review Date.";
                errorMessages.style.display = "block";
                return;
            }

            if (startDate >= endDate) {
                errorMessages.innerHTML = "Error: Start date must be before the completion date.";
                errorMessages.style.display = "block";
                return;
            }

            if (reviewDate < startDate) {
                errorMessages.innerHTML = "Error: Review date cannot be before the project start date.";
                errorMessages.style.display = "block";
                return;
            }

            if (isNaN(actualProgressInr) || actualProgressInr < 0) {
                errorMessages.innerHTML = "Error: Please enter a valid Actual Progress amount.";
                errorMessages.style.display = "block";
                return;
            }

            const formattedStartDate = formatDateToDDMMYYYY(startDateValue);
            const formattedEndDate = formatDateToDDMMYYYY(endDateValue);
            const formattedReviewDate = formatDateToDDMMYYYY(reviewDateValue);

            const totalProjectDuration = (endDate - startDate) / (1000 * 60 * 60 * 24);
            const elapsedDays = (reviewDate - startDate) / (1000 * 60 * 60 * 24);

            // Build bilingual calculation steps (English then Hindi lines)
            let calculationSteps = '';

            calculationSteps += `<div class="calculation-step">
                <h4>Step 1: Input Parameters</h4>
                <p>Project Start Date: ${formattedStartDate}</p>
                <p class="hindi">परियोजना प्रारंभ तिथि: ${formattedStartDate}</p>
                <p>Project Completion Date: ${formattedEndDate}</p>
                <p class="hindi">परियोजना समापन तिथि: ${formattedEndDate}</p>
                <p>Review Date: <span class="highlight">${formattedReviewDate}</span></p>
                <p class="hindi">समीक्षा तिथि: <span class="highlight">${formattedReviewDate}</span></p>
                <p>Work Order Amount: <span class="highlight">₹${workOrderAmount.toLocaleString('en-IN')}</span></p>
                <p class="hindi">वर्क ऑर्डर राशि: <span class="highlight">₹${workOrderAmount.toLocaleString('en-IN')}</span></p>
                <p>Actual Progress: <span class="highlight">₹${actualProgressInr.toLocaleString('en-IN')}</span></p>
                <p class="hindi">वास्तविक प्रगति: <span class="highlight">₹${actualProgressInr.toLocaleString('en-IN')}</span></p>
            </div>`;

            calculationSteps += `<div class="calculation-step">
                <h4>Step 2: Calculate Total Project Duration</h4>
                <p>Total Project Duration = (End Date - Start Date) in days</p>
                <p class="hindi">कुल परियोजना अवधि = (समापन तिथि - प्रारंभ तिथि) दिनों में</p>
                <p>Total Project Duration = <span class="highlight">${Math.round(totalProjectDuration)} days</span></p>
                <p class="hindi">कुल परियोजना अवधि = <span class="highlight">${Math.round(totalProjectDuration)} दिन</span></p>
            </div>`;

            calculationSteps += `<div class="calculation-step">
                <h4>Step 3: Calculate Elapsed Days</h4>
                <p>Elapsed Days = (Review Date - Start Date) in days</p>
                <p class="hindi">बीते हुए दिन = (समीक्षा तिथि - प्रारंभ तिथि) दिनों में</p>
                <p>Elapsed Days = <span class="highlight">${Math.round(elapsedDays)} days</span></p>
                <p class="hindi">बीते हुए दिन = <span class="highlight">${Math.round(elapsedDays)} दिन</span></p>
            </div>`;

            const firstQuarterEnd = Math.round(totalProjectDuration * 0.25);
            const secondQuarterEnd = Math.round(totalProjectDuration * 0.50);
            const thirdQuarterEnd = Math.round(totalProjectDuration * 0.75);

            calculationSteps += `<div class="calculation-step">
                <h4>Step 4: Define Quarter Boundaries</h4>
                <p>First Quarter End = Total Duration × 0.25 = ${Math.round(totalProjectDuration)} × 0.25 = <span class="highlight">${firstQuarterEnd} days</span></p>
                <p class="hindi">पहली तिमाही समाप्त = कुल अवधि × 0.25 = <span class="highlight">${firstQuarterEnd} दिन</span></p>
                <p>Second Quarter End = Total Duration × 0.50 = <span class="highlight">${secondQuarterEnd} days</span></p>
                <p class="hindi">दूसरी तिमाही समाप्त = कुल अवधि × 0.50 = <span class="highlight">${secondQuarterEnd} दिन</span></p>
                <p>Third Quarter End = Total Duration × 0.75 = <span class="highlight">${thirdQuarterEnd} days</span></p>
                <p class="hindi">तीसरी तिमाही समाप्त = कुल अवधि × 0.75 = <span class="highlight">${thirdQuarterEnd} दिन</span></p>
            </div>`;

            const firstQuarterLength = firstQuarterEnd;
            const secondQuarterLength = secondQuarterEnd - firstQuarterEnd;
            const thirdQuarterLength = thirdQuarterEnd - secondQuarterEnd;
            const fourthQuarterLength = Math.round(totalProjectDuration) - thirdQuarterEnd;

            calculationSteps += `<div class="calculation-step">
                <h4>Step 5: Calculate Length of Each Quarter</h4>
                <p>First Quarter Length = <span class="highlight">${firstQuarterLength} days</span></p>
                <p class="hindi">पहली तिमाही की अवधि = <span class="highlight">${firstQuarterLength} दिन</span></p>
                <p>Second Quarter Length = <span class="highlight">${secondQuarterLength} days</span></p>
                <p class="hindi">दूसरी तिमाही की अवधि = <span class="highlight">${secondQuarterLength} दिन</span></p>
                <p>Third Quarter Length = <span class="highlight">${thirdQuarterLength} days</span></p>
                <p class="hindi">तीसरी तिमाही की अवधि = <span class="highlight">${thirdQuarterLength} दिन</span></p>
                <p>Fourth Quarter Length = <span class="highlight">${fourthQuarterLength} days</span></p>
                <p class="hindi">चौथी तिमाही की अवधि = <span class="highlight">${fourthQuarterLength} दिन</span></p>
            </div>`;

            const firstQuarterWork = Math.round(workOrderAmount * 0.125);
            const secondQuarterWork = Math.round(workOrderAmount * 0.25);
            const thirdQuarterWork = Math.round(workOrderAmount * 0.375);
            const fourthQuarterWork = workOrderAmount - firstQuarterWork - secondQuarterWork - thirdQuarterWork;

            calculationSteps += `<div class="calculation-step">
                <h4>Step 6: Calculate Work Distribution</h4>
                <p>First Quarter Work = Work Order Amount × 12.5% = <span class="highlight">₹${firstQuarterWork.toLocaleString('en-IN')}</span></p>
                <p class="hindi">पहली तिमाही कार्य = वर्क ऑर्डर राशि × 12.5% = <span class="highlight">₹${firstQuarterWork.toLocaleString('en-IN')}</span></p>
                <p>Second Quarter Work = Work Order Amount × 25% = <span class="highlight">₹${secondQuarterWork.toLocaleString('en-IN')}</span></p>
                <p class="hindi">दूसरी तिमाही कार्य = वर्क ऑर्डर राशि × 25% = <span class="highlight">₹${secondQuarterWork.toLocaleString('en-IN')}</span></p>
                <p>Third Quarter Work = Work Order Amount × 37.5% = <span class="highlight">₹${thirdQuarterWork.toLocaleString('en-IN')}</span></p>
                <p class="hindi">तीसरी तिमाही कार्य = वर्क ऑर्डर राशि × 37.5% = <span class="highlight">₹${thirdQuarterWork.toLocaleString('en-IN')}</span></p>
                <p>Fourth Quarter Work = Work Order Amount × 25% = <span class="highlight">₹${fourthQuarterWork.toLocaleString('en-IN')}</span></p>
                <p class="hindi">चौथी तिमाही कार्य = वर्क ऑर्डर राशि × 25% = <span class="highlight">₹${fourthQuarterWork.toLocaleString('en-IN')}</span></p>
            </div>`;

            const firstQuarterDaily = Math.ceil(firstQuarterWork / firstQuarterLength);
            const secondQuarterDaily = Math.ceil(secondQuarterWork / secondQuarterLength);
            const thirdQuarterDaily = Math.ceil(thirdQuarterWork / thirdQuarterLength);
            const fourthQuarterDaily = Math.ceil(fourthQuarterWork / fourthQuarterLength);

            calculationSteps += `<div class="calculation-step">
                <h4>Step 7: Calculate Daily Progress Required (P/N)</h4>
                <p>First Quarter Daily Progress = ₹${firstQuarterWork} / ${firstQuarterLength} days = <span class="highlight">₹${firstQuarterDaily}/day</span></p>
                <p class="hindi">पहली तिमाही दैनिक प्रगति = ₹${firstQuarterWork} / ${firstQuarterLength} दिन = <span class="highlight">₹${firstQuarterDaily}/दिन</span></p>
                <p>Second Quarter Daily Progress = ₹${secondQuarterWork} / ${secondQuarterLength} days = <span class="highlight">₹${secondQuarterDaily}/day</span></p>
                <p class="hindi">दूसरी तिमाही दैनिक प्रगति = ₹${secondQuarterWork} / ${secondQuarterLength} दिन = <span class="highlight">₹${secondQuarterDaily}/दिन</span></p>
                <p>Third Quarter Daily Progress = ₹${thirdQuarterWork} / ${thirdQuarterLength} days = <span class="highlight">₹${thirdQuarterDaily}/day</span></p>
                <p class="hindi">तीसरी तिमाही दैनिक प्रगति = ₹${thirdQuarterWork} / ${thirdQuarterLength} दिन = <span class="highlight">₹${thirdQuarterDaily}/दिन</span></p>
                <p>Fourth Quarter Daily Progress = ₹${fourthQuarterWork} / ${fourthQuarterLength} days = <span class="highlight">₹${fourthQuarterDaily}/day</span></p>
                <p class="hindi">चौथी तिमाही दैनिक प्रगति = ₹${fourthQuarterWork} / ${fourthQuarterLength} दिन = <span class="highlight">₹${fourthQuarterDaily}/दिन</span></p>
            </div>`;

            let requiredProgress;
            let quarterInfo = "";

            if (elapsedDays <= firstQuarterEnd) {
                requiredProgress = elapsedDays * firstQuarterDaily;
                quarterInfo = `First Quarter (0-${firstQuarterEnd} days)`;
                calculationSteps += `<div class="calculation-step">
                    <h4>Step 8: Determine Current Quarter</h4>
                    <p>Since Elapsed Days (${Math.round(elapsedDays)}) <= First Quarter End (${firstQuarterEnd}), we are in the First Quarter</p>
                    <p class="hindi">क्योंकि बीते हुए दिन (${Math.round(elapsedDays)}) ≤ पहली तिमाही समाप्त (${firstQuarterEnd}), हम पहली तिमाही में हैं</p>
                </div>`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 9: Calculate Required Progress</h4>
                    <p>Required Progress = Elapsed Days × First Quarter Daily Rate</p>
                    <p class="hindi">आवश्यक प्रगति = बीते हुए दिन × पहली तिमाही दैनिक दर</p>
                    <p>Required Progress = ${Math.round(elapsedDays)} × ₹${Math.round(firstQuarterDaily)}/day = <span class="highlight">₹${Math.round(elapsedDays * firstQuarterDaily)}</span></p>
                    <p class="hindi">आवश्यक प्रगति = ${Math.round(elapsedDays)} × ₹${Math.round(firstQuarterDaily)}/दिन = <span class="highlight">₹${Math.round(elapsedDays * firstQuarterDaily)}</span></p>
                </div>`;
            } else if (elapsedDays <= secondQuarterEnd) {
                const daysInSecondQuarter = elapsedDays - firstQuarterEnd;
                requiredProgress = firstQuarterWork + (daysInSecondQuarter * secondQuarterDaily);
                quarterInfo = `Second Quarter (${firstQuarterEnd}-${secondQuarterEnd} days)`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 8: Determine Current Quarter</h4>
                    <p>Since Elapsed Days (${Math.round(elapsedDays)}) > First Quarter End (${firstQuarterEnd}) and ≤ Second Quarter End (${secondQuarterEnd}), we are in the Second Quarter</p>
                    <p class="hindi">क्योंकि बीते हुए दिन (${Math.round(elapsedDays)}) > पहली तिमाही समाप्त (${firstQuarterEnd}) और ≤ दूसरी तिमाही समाप्त (${secondQuarterEnd}), हम दूसरी तिमाही में हैं</p>
                </div>`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 9: Calculate Required Progress</h4>
                    <p>Days in Second Quarter = Elapsed Days - First Quarter End = ${Math.round(elapsedDays)} - ${firstQuarterEnd} = ${Math.round(daysInSecondQuarter)} days</p>
                    <p class="hindi">दूसरी तिमाही में दिन = बीते हुए दिन - पहली तिमाही समाप्त = ${Math.round(daysInSecondQuarter)} दिन</p>
                    <p>Required Progress = First Quarter Work + (Days in Second Quarter × Second Quarter Daily Rate)</p>
                    <p class="hindi">आवश्यक प्रगति = पहली तिमाही कार्य + (दूसरी तिमाही के दिन × दूसरी तिमाही दैनिक दर)</p>
                    <p>Required Progress = ₹${firstQuarterWork} + (${Math.round(daysInSecondQuarter)} × ₹${Math.round(secondQuarterDaily)}/day) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                    <p class="hindi">आवश्यक प्रगति = ₹${firstQuarterWork} + (${Math.round(daysInSecondQuarter)} × ₹${Math.round(secondQuarterDaily)}/दिन) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                </div>`;
            } else if (elapsedDays <= thirdQuarterEnd) {
                const daysInThirdQuarter = elapsedDays - secondQuarterEnd;
                requiredProgress = firstQuarterWork + secondQuarterWork + (daysInThirdQuarter * thirdQuarterDaily);
                quarterInfo = `Third Quarter (${secondQuarterEnd}-${thirdQuarterEnd} days)`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 8: Determine Current Quarter</h4>
                    <p>Since Elapsed Days (${Math.round(elapsedDays)}) > Second Quarter End (${secondQuarterEnd}) and ≤ Third Quarter End (${thirdQuarterEnd}), we are in the Third Quarter</p>
                    <p class="hindi">क्योंकि बीते हुए दिन (${Math.round(elapsedDays)}) > दूसरी तिमाही समाप्त (${secondQuarterEnd}) और ≤ तीसरी तिमाही समाप्त (${thirdQuarterEnd}), हम तीसरी तिमाही में हैं</p>
                </div>`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 9: Calculate Required Progress</h4>
                    <p>Days in Third Quarter = Elapsed Days - Second Quarter End = ${Math.round(elapsedDays)} - ${secondQuarterEnd} = ${Math.round(daysInThirdQuarter)} days</p>
                    <p class="hindi">तीसरी तिमाही में दिन = बीते हुए दिन - दूसरी तिमाही समाप्त = ${Math.round(daysInThirdQuarter)} दिन</p>
                    <p>Required Progress = First Quarter Work + Second Quarter Work + (Days in Third Quarter × Third Quarter Daily Rate)</p>
                    <p class="hindi">आवश्यक प्रगति = पहली तिमाही कार्य + दूसरी तिमाही कार्य + (तीसरी तिमाही के दिन × तीसरी तिमाही दैनिक दर)</p>
                    <p>Required Progress = ₹${firstQuarterWork} + ₹${secondQuarterWork} + (${Math.round(daysInThirdQuarter)} × ₹${Math.round(thirdQuarterDaily)}/day) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                    <p class="hindi">आवश्यक प्रगति = ₹${firstQuarterWork} + ₹${secondQuarterWork} + (${Math.round(daysInThirdQuarter)} × ₹${Math.round(thirdQuarterDaily)}/दिन) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                </div>`;
            } else {
                const daysInFourthQuarter = elapsedDays - thirdQuarterEnd;
                requiredProgress = firstQuarterWork + secondQuarterWork + thirdQuarterWork + (daysInFourthQuarter * fourthQuarterDaily);
                quarterInfo = `Fourth Quarter (${thirdQuarterEnd}-${Math.round(totalProjectDuration)} days)`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 8: Determine Current Quarter</h4>
                    <p>Since Elapsed Days (${Math.round(elapsedDays)}) > Third Quarter End (${thirdQuarterEnd}), we are in the Fourth Quarter</p>
                    <p class="hindi">क्योंकि बीते हुए दिन (${Math.round(elapsedDays)}) > तीसरी तिमाही समाप्त (${thirdQuarterEnd}), हम चौथी तिमाही में हैं</p>
                </div>`;

                calculationSteps += `<div class="calculation-step">
                    <h4>Step 9: Calculate Required Progress</h4>
                    <p>Days in Fourth Quarter = Elapsed Days - Third Quarter End = ${Math.round(elapsedDays)} - ${thirdQuarterEnd} = ${Math.round(daysInFourthQuarter)} days</p>
                    <p class="hindi">चौथी तिमाही में दिन = बीते हुए दिन - तीसरी तिमाही समाप्त = ${Math.round(daysInFourthQuarter)} दिन</p>
                    <p>Required Progress = First Quarter Work + Second Quarter Work + Third Quarter Work + (Days in Fourth Quarter × Fourth Quarter Daily Rate)</p>
                    <p class="hindi">आवश्यक प्रगति = पहली + दूसरी + तीसरी तिमाही कार्य + (चौथी तिमाही के दिन × चौथी तिमाही दैनिक दर)</p>
                    <p>Required Progress = ₹${firstQuarterWork} + ₹${secondQuarterWork} + ₹${thirdQuarterWork} + (${Math.round(daysInFourthQuarter)} × ₹${Math.round(fourthQuarterDaily)}/day) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                    <p class="hindi">आवश्यक प्रगति = ₹${firstQuarterWork} + ₹${secondQuarterWork} + ₹${thirdQuarterWork} + (${Math.round(daysInFourthQuarter)} × ₹${Math.round(fourthQuarterDaily)}/दिन) = <span class="highlight">₹${Math.round(requiredProgress)}</span></p>
                </div>`;
            }

            requiredProgress = Math.min(Math.round(requiredProgress), workOrderAmount);

            const unexecutedWork = Math.max(0, requiredProgress - actualProgressInr);

            calculationSteps += `<div class="calculation-step">
                <h4>Step 10: Calculate Unexecuted Work</h4>
                <p>Unexecuted Work = Max(0, Required Progress - Actual Progress)</p>
                <p class="hindi">अनुपादित कार्य = Max(0, आवश्यक प्रगति - वास्तविक प्रगति)</p>
                <p>Unexecuted Work = Max(0, ₹${requiredProgress.toLocaleString('en-IN')} - ₹${actualProgressInr.toLocaleString('en-IN')}) = <span class="highlight">₹${unexecutedWork.toLocaleString('en-IN')}</span></p>
                <p class="hindi">अनुपादित कार्य = Max(0, ₹${requiredProgress.toLocaleString('en-IN')} - ₹${actualProgressInr.toLocaleString('en-IN')}) = <span class="highlight">₹${unexecutedWork.toLocaleString('en-IN')}</span></p>
            </div>`;

            let penaltyRate;
            if (elapsedDays <= firstQuarterEnd) {
                penaltyRate = 0.025;
            } else if (elapsedDays <= secondQuarterEnd) {
                penaltyRate = 0.05;
            } else if (elapsedDays <= thirdQuarterEnd) {
                penaltyRate = 0.075;
            } else {
                penaltyRate = 0.10;
            }

            const penalty = Math.round(penaltyRate * unexecutedWork);

            calculationSteps += `<div class="calculation-step">
                <h4>Step 11: Determine Penalty Rate</h4>
                <p>Penalty Rate for ${quarterInfo} = <span class="highlight">${(penaltyRate * 100).toFixed(1)}%</span></p>
                <p class="hindi">${quarterInfo} के लिए दंड दर = <span class="highlight">${(penaltyRate * 100).toFixed(1)}%</span></p>
            </div>`;

            calculationSteps += `<div class="calculation-step">
                <h4>Step 12: Calculate Liquidity Damages (Penalty)</h4>
                <p>Penalty = Penalty Rate × Unexecuted Work</p>
                <p class="hindi">दंड = दंड दर × अनुपादित कार्य</p>
                <p>Penalty = ${(penaltyRate * 100).toFixed(1)}% × ₹${unexecutedWork.toLocaleString('en-IN')} = <span class="highlight">₹${penalty.toLocaleString('en-IN')}</span></p>
                <p class="hindi">दंड = ${(penaltyRate * 100).toFixed(1)}% × ₹${unexecutedWork.toLocaleString('en-IN')} = <span class="highlight">₹${penalty.toLocaleString('en-IN')}</span></p>
            </div>`;

            calculationStepsDiv.innerHTML = calculationSteps;
            calculationStepsPrintDiv.innerHTML = calculationSteps;

            document.getElementById("requiredProgress").textContent = requiredProgress.toLocaleString('en-IN');
            document.getElementById("requiredProgressHindi").textContent = requiredProgress.toLocaleString('en-IN');
            document.getElementById("actualProgressResult").textContent = actualProgressInr.toLocaleString('en-IN');
            document.getElementById("actualProgressResultHindi").textContent = actualProgressInr.toLocaleString('en-IN');
            document.getElementById("unexecutedWork").textContent = Math.round(unexecutedWork).toLocaleString('en-IN');
            document.getElementById("unexecutedWorkHindi").textContent = Math.round(unexecutedWork).toLocaleString('en-IN');
            document.getElementById("penalty").textContent = Math.round(penalty).toLocaleString('en-IN');
            document.getElementById("penaltyHindi").textContent = Math.round(penalty).toLocaleString('en-IN');

            document.getElementById("printWorkOrderAmount").textContent = workOrderAmount.toLocaleString('en-IN');
            document.getElementById("printStartDate").textContent = formattedStartDate;
            document.getElementById("printEndDate").textContent = formattedEndDate;
            document.getElementById("printReviewDate").textContent = formattedReviewDate;
            document.getElementById("printActualProgress").textContent = actualProgressInr.toLocaleString('en-IN');
            document.getElementById("printRequiredProgress").textContent = requiredProgress.toLocaleString('en-IN');
            document.getElementById("printUnexecutedWork").textContent = Math.round(unexecutedWork).toLocaleString('en-IN');
            document.getElementById("printPenalty").textContent = Math.round(penalty).toLocaleString('en-IN');

            resultsDiv.style.display = "block";
            successDiv.innerHTML = "This Software is an Initiative by Mrs. Premlata Jain, AAO, PWD, Udaipur, Rajasthan<br>Based on prevailing PWF&AR";
            successDiv.style.display = "block";
        }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="calculate"]').forEach(control => {
        control.addEventListener('click', calculate);
    });
    document.querySelectorAll('[data-action="details"]').forEach(control => {
        control.addEventListener('click', showDetailedCalculation);
    });
    document.querySelectorAll('[data-action="print-abstract"]').forEach(control => {
        control.addEventListener('click', printAbstract);
    });
    document.querySelectorAll('[data-action="print-detail"]').forEach(control => {
        control.addEventListener('click', printDetailed);
    });
});
