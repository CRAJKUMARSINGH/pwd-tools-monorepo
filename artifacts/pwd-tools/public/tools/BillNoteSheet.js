        // DOM Elements
        const billTypeSelect = document.getElementById('billType');
        const extraItemSelect = document.getElementById('extraItem');
        const extraItemAmountGroup = document.getElementById('extraItemAmountGroup');
        const outputElement = document.getElementById('output');
        const outputText = document.getElementById('outputText');
        const actionButtons = document.getElementById('actionButtons');
        const finalOnlyFields = document.querySelectorAll('.final-only');
        const startDatePicker = document.getElementById('startDatePicker');
        const startDateInput = document.getElementById('startDate');
        const scheduleCompletionPicker = document.getElementById('scheduleCompletionPicker');
        const scheduleCompletionInput = document.getElementById('scheduleCompletion');
        const actualCompletionPicker = document.getElementById('actualCompletionPicker');
        const actualCompletionInput = document.getElementById('actualCompletion');

        // Show/hide fields based on bill type
        billTypeSelect.addEventListener('change', function () {
            const isFinal = this.value === 'final';
            finalOnlyFields.forEach(field => {
                field.style.display = isFinal ? 'block' : 'none';
            });
        });

        // Show/hide extra item amount field
        extraItemSelect.addEventListener('change', function () {
            extraItemAmountGroup.style.display = this.value === 'Yes' ? 'block' : 'none';
        });

        // Date formatting function: YYYY-MM-DD to DD/MM/YYYY
        function formatDateToDDMMYYYY(dateStr) {
            if (!dateStr) return '';
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        }

        // Date parsing function: DD/MM/YYYY or YYYY-MM-DD to Date object
        function parseDate(dateStr) {
            let day, month, year;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                // Handle YYYY-MM-DD
                [year, month, day] = dateStr.split('-').map(Number);
                month -= 1; // Months are 0-based
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                // Handle DD/MM/YYYY
                [day, month, year] = dateStr.split('/').map(Number);
                month -= 1; // Months are 0-based
            } else {
                return null;
            }
            const date = new Date(year, month, day);
            // Validate date
            if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
                return null;
            }
            return date;
        }

        // Update text input when date picker changes
        function updateDateInput(picker, input) {
            picker.addEventListener('change', function () {
                input.value = formatDateToDDMMYYYY(this.value);
            });
        }

        // Bind date pickers to text inputs
        updateDateInput(startDatePicker, startDateInput);
        updateDateInput(scheduleCompletionPicker, scheduleCompletionInput);
        updateDateInput(actualCompletionPicker, actualCompletionInput);

        // Modal functions
        function showModal(message) {
            document.getElementById('modalMessage').textContent = message;
            document.getElementById('alertModal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('alertModal').style.display = 'none';
        }

        // Form validation
        function validateForm() {
            let isValid = true;
            const billType = billTypeSelect.value;
            const requiredFields = billType === 'final' ? [
                'billType', 'workOrderAmount', 'uptoDateBillAmount',
                'startDate', 'scheduleCompletion', 'actualCompletion'
            ] : ['billType', 'workOrderAmount', 'uptoDateBillAmount'];

            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

            // Validate required fields
            const missingFields = [];
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    document.getElementById(`${fieldId}Error`).style.display = 'block';
                    missingFields.push(field.previousElementSibling.textContent.replace(' *', ''));
                    isValid = false;
                }
            });

            if (missingFields.length > 0) {
                showModal(`कृपया सभी आवश्यक फ़ील्ड भरें:\n${missingFields.join('\n')}`);
                return false;
            }

            // Validate amounts
            const workOrderAmount = parseFloat(document.getElementById('workOrderAmount').value);
            const uptoDateBillAmount = parseFloat(document.getElementById('uptoDateBillAmount').value);

            if (isNaN(workOrderAmount) || workOrderAmount <= 0) {
                document.getElementById('workOrderAmountError').textContent = 'राशि 0 से अधिक होनी चाहिए';
                document.getElementById('workOrderAmountError').style.display = 'block';
                showModal('वर्क ऑर्डर राशि 0 से अधिक होनी चाहिए');
                isValid = false;
            }

            if (isNaN(uptoDateBillAmount) || uptoDateBillAmount < 0) {
                document.getElementById('uptoDateBillAmountError').textContent = 'राशि नकारात्मक नहीं हो सकती';
                document.getElementById('uptoDateBillAmountError').style.display = 'block';
                showModal('अब तक की बिल राशि नकारात्मक नहीं हो सकती');
                isValid = false;
            }

            // Validate dates for final bill
            if (billType === 'final') {
                const startDateStr = startDateInput.value;
                const scheduleDateStr = scheduleCompletionInput.value;
                const actualDateStr = actualCompletionInput.value;

                const startDate = parseDate(startDateStr);
                const scheduleDate = parseDate(scheduleDateStr);
                const actualDate = parseDate(actualDateStr);

                if (!startDate || !scheduleDate || !actualDate) {
                    if (!startDate) document.getElementById('startDateError').style.display = 'block';
                    if (!scheduleDate) document.getElementById('scheduleCompletionError').style.display = 'block';
                    if (!actualDate) document.getElementById('actualCompletionError').style.display = 'block';
                    showModal('कृपया DD/MM/YYYY प्रारूप में मान्य तिथियाँ चुनें');
                    isValid = false;
                } else if (startDate > scheduleDate) {
                    document.getElementById('scheduleCompletionError').style.display = 'block';
                    showModal('निर्धारित समापन तिथि प्रारंभ तिथि के बाद होनी चाहिए');
                    isValid = false;
                } else if (actualDate < startDate) {
                    document.getElementById('actualCompletionError').style.display = 'block';
                    showModal('वास्तविक समापन तिथि प्रारंभ तिथि के बाद होनी चाहिए');
                    isValid = false;
                }
            }

            return isValid;
        }

        // Generate the note
        function generateNote() {
            if (!validateForm()) {
                return;
            }

            // Get form values
            const billType = billTypeSelect.value;
            const workOrderAmount = parseFloat(document.getElementById('workOrderAmount').value);
            const uptoDateBillAmount = parseFloat(document.getElementById('uptoDateBillAmount').value);
            const extraItem = extraItemSelect.value;
            const extraItemAmount = parseFloat(document.getElementById('extraItemAmount').value) || 0;

            // Calculate percentage
            const percentageWorkDone = (uptoDateBillAmount / workOrderAmount) * 100;

            // Generate note
            let note = '';
            let serialNumber = 1;

            if (billType === 'running') {
                note += `${serialNumber++}. इस Stage में कार्य ${percentageWorkDone.toFixed(2)}% संपादित हुआ है।\n`;
                note += `${serialNumber++}. कार्य प्रगति पर है।\n`;
                if (extraItem === 'Yes') {
                    const extraItemPercentage = (extraItemAmount / workOrderAmount) * 100;
                    if (extraItemPercentage > 5) {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, जो 5% से अधिक है। जिसकी स्वीकृति Superintending Engineer, PWD Rural circle कार्यालय के क्षेत्राधिकार में है।\n`;
                    } else if (extraItemPercentage === 5) {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, जो 5% के बराबर है। जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।\n`;
                    } else {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, जो 5% से कम है। जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।\n`;
                    }
                }
                note += `${serialNumber++}. उपरोक्त विवरण के सन्दर्भ में समुचित निर्णय हेतु प्रस्तुत है।`;
            } else {
                const startDate = parseDate(startDateInput.value);
                const scheduleCompletion = parseDate(scheduleCompletionInput.value);
                const actualCompletion = parseDate(actualCompletionInput.value);
                const repairWork = document.getElementById('repairWork').value;
                const excessQuantity = document.getElementById('excessQuantity').value;
                const delayComment = document.getElementById('delayComment').value;

                note += `${serialNumber++}. कार्य ${percentageWorkDone.toFixed(2)}% पूर्ण हुआ है।\n`;
                if (percentageWorkDone < 90) {
                    note += `${serialNumber}. कार्य का वांछित Deviation Statement भी स्वीकृति हेतु प्राप्त हुआ है, जिसकी स्वीकृति इसी कार्यालय के क्षेत्राधिकार में निहित है।\n`;
                    serialNumber++;
                } else if (percentageWorkDone > 100) {
                    note += `${serialNumber}. कार्य का वांछित Deviation Statement भी स्वीकृति हेतु प्राप्त हुआ है, OVERALL EXCESS वर्क आर्डर राशि के 5% से कम/बराबर है जिसकी स्वीकृति इसी कार्यालय के क्षेत्राधिकार में निहित है।\n`;
                    serialNumber++;
                }

                let delayDays = Math.floor((actualCompletion - scheduleCompletion) / (1000 * 60 * 60 * 24));
                if (actualCompletion > scheduleCompletion) {
                    note += `${serialNumber}. कार्य में ${delayDays} दिन की देरी हुई है।\n`;
                    serialNumber++;
                    let scheduleDuration = Math.floor((scheduleCompletion - startDate) / (1000 * 60 * 60 * 24));
                    if (delayDays > (scheduleDuration / 2 + 1)) {
                        note += `${serialNumber}. Time Extension केस Superintending Engineer, PWD Rural circle कार्यालय द्वारा अनुमोदित किया जाना है।\n`;
                    } else {
                        note += `${serialNumber}. Time Extension केस इस कार्यालय द्वारा अनुमोदित किया जाना है।\n`;
                    }
                    serialNumber++;
                } else {
                    note += `${serialNumber}. कार्य समय पर संपादित हुआ है।\n`;
                    serialNumber++;
                }

                if (extraItem === 'Yes') {
                    const extraItemPercentage = (extraItemAmount / workOrderAmount) * 100;
                    if (extraItemPercentage > 5) {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, जो 5% से अधिक है। जिसकी स्वीकृति Superintending Engineer, PWD Rural circle कार्यालय के क्षेत्राधिकार में है।\n`;
                    } else if (extraItemPercentage === 5) {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, अथवा (5% के बराबर है)। जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।\n`;
                    } else {
                        note += `${serialNumber++}. ₹${extraItemAmount.toFixed(2)} की Extra Items कार्यान्वित किए गए हैं, जो वर्क ऑर्डर राशि का ${extraItemPercentage.toFixed(2)}% है, जो 5% से कम है। जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।\n`;
                    }
                }

                if (excessQuantity === 'Yes') {
                    note += `${serialNumber++}. Work Order के कुछ आइटम में अतिरिक्त मात्रा (Excess Quantity) संपादित की गई है।  इसके लिए Deviation Statement भी स्वीकृति हेतु प्राप्त हुआ है ।\n`;
                }

                note += `${serialNumber}. गुणवत्ता नियंत्रण (Q.C.) परीक्षण रिपोर्ट (Test Reports) संलग्न हैं।\n`;
                serialNumber++;

                if (repairWork === "No") {
                    note += `${serialNumber}. हस्तांतरण विवरण Hand Over Statement संलग्न है।\n`;
                    serialNumber++;
                }

                if (delayComment === "Yes") {
                    note += `${serialNumber}. कार्य समाप्ति के करीब 6 महीने बाद फाइनल बिल इस कार्यालय में प्रस्तुत किया गया है। इस अप्रत्याशित देरी के लिए सहायक अभियंता से स्पष्टीकरण मांगा जाए, ऐसी प्रस्तावना है।\n`;
                    serialNumber++;
                }

                note += `${serialNumber++}. उचित निर्णय के लिए उपर्युक्त विवरण संलग्न है।`;
            }

            // Display output
            outputText.textContent = note;
            outputElement.style.display = 'block';
            actionButtons.style.display = 'flex';
            outputElement.scrollIntoView({ behavior: 'smooth' });
        }

        // Reset form
        function resetForm() {
            document.querySelectorAll('input, select').forEach(element => {
                if (element.type !== 'button') {
                    element.value = element.tagName === 'SELECT' ? element.options[0].value : '';
                }
            });
            outputText.textContent = 'फॉर्म भरें और "नोट शीट जनरेट करें" पर क्लिक करें।';
            outputElement.style.display = 'none';
            actionButtons.style.display = 'none';
            document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
            extraItemAmountGroup.style.display = 'none';
            finalOnlyFields.forEach(field => field.style.display = 'none');
        }

        // Print note
        function printNote() {
            window.print();
        }

        // Copy to clipboard
        function copyToClipboard() {
            const noteText = outputText.textContent;
            navigator.clipboard.writeText(noteText).then(() => {
                showModal('नोट क्लिपबोर्ड पर कॉपी किया गया!');
            }).catch(err => {
                showModal('नोट कॉपी करने में विफल: ' + err);
            });
        }

        // Bind buttons to functions
        document.getElementById('generateBtn').addEventListener('click', generateNote);
        document.getElementById('resetBtn').addEventListener('click', resetForm);
        document.getElementById('printBtn').addEventListener('click', printNote);
        document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

        // Close modal when clicking outside
        window.onclick = function (event) {
            const modal = document.getElementById('alertModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="generate"]').forEach(control => {
        control.addEventListener('click', generateNote);
    });
    document.querySelectorAll('[data-action="reset"]').forEach(control => {
        control.addEventListener('click', resetForm);
    });
    document.querySelectorAll('[data-action="print"]').forEach(control => {
        control.addEventListener('click', printNote);
    });
    document.querySelectorAll('[data-action="copy"]').forEach(control => {
        control.addEventListener('click', copyToClipboard);
    });
    document.querySelectorAll('[data-action="close"]').forEach(control => {
        control.addEventListener('click', closeModal);
    });
});
