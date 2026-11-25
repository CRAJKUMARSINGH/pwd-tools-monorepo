        let billCount = 1;
        const maxBills = 10;

        function addBill() {
            if (billCount >= maxBills) {
                alert(`Maximum ${maxBills} bills allowed`);
                return;
            }
            billCount++;
            const tbody = document.getElementById('depositRows');
            const newRow = document.createElement('tr');
            let billType = '';
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            if (billCount <= romanNumerals.length) {
                billType = romanNumerals[billCount - 1] + ' RB';
            } else {
                billType = 'Bill ' + billCount;
            }
            newRow.innerHTML = `
                <td><input type="text" value="${billType}" class="bill-type" readonly></td>
                <td><input type="text" class="bill-mb"></td>
                <td><input type="text" value="SD II" class="bill-sd" readonly></td>
                <td><input type="number" class="bill-amount"></td>
                <td><button type="button" data-action="remove-this-bill" class="remove-bill">X</button></td>
            `;
            tbody.appendChild(newRow);
            document.getElementById('removeBillBtn').disabled = billCount <= 1;
        }

        function removeBill() {
            if (billCount <= 1) {
                alert("At least one bill is required");
                return;
            }
            const tbody = document.getElementById('depositRows');
            tbody.removeChild(tbody.lastElementChild);
            billCount--;
            document.getElementById('removeBillBtn').disabled = billCount <= 1;
        }

        function removeThisBill(button) {
            if (billCount <= 1) {
                alert("At least one bill is required");
                return;
            }
            const row = button.closest('tr');
            row.parentNode.removeChild(row);
            billCount--;
            const rows = document.querySelectorAll('#depositRows tr');
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            rows.forEach((row, index) => {
                const typeInput = row.querySelector('.bill-type');
                if (index < romanNumerals.length) {
                    typeInput.value = romanNumerals[index] + ' RB';
                } else {
                    typeInput.value = 'Bill ' + (index + 1);
                }
            });
            document.getElementById('removeBillBtn').disabled = billCount <= 1;
        }

        function generateReport() {
            const contractorName = document.getElementById('contractorName').value;
            const workName = document.getElementById('workName').value;
            const agreementNo = document.getElementById('agreementNo').value;
            const commencementDate = document.getElementById('commencementDate').value;
            const stipulatedDate = document.getElementById('stipulatedDate').value;
            const actualDate = document.getElementById('actualDate').value;
            const mbNo = document.getElementById('mbNo').value;
            const inspectionDate = document.getElementById('inspectionDate').value;
            const finalBillDate = document.getElementById('finalBillDate').value;
            const dlpExpiryDate = document.getElementById('dlpExpiryDate').value;

            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB');
            };

            const depositRows = document.querySelectorAll('#depositRows tr');
            let total = 0;
            const depositDetails = [];
            depositRows.forEach((row, index) => {
                const typeInput = row.querySelector('.bill-type');
                const mbInput = row.querySelector('.bill-mb');
                const sdInput = row.querySelector('.bill-sd');
                const amountInput = row.querySelector('.bill-amount');
                let billType = typeInput.value;
                if (index === depositRows.length - 1) {
                    if (billType.includes('RB')) {
                        billType = billType.replace('RB', 'RB & Final Bill');
                    } else {
                        billType += ' & Final Bill';
                    }
                }
                const amount = amountInput.value ? parseFloat(amountInput.value) : 0;
                total += amount;
                depositDetails.push({
                    type: billType,
                    mb: mbInput.value || '',
                    sd: sdInput.value || 'SD II',
                    amount: amount ? amount.toLocaleString('en-IN') : ''
                });
            });

            document.getElementById('result-contractor').textContent = contractorName || '';
            document.getElementById('result-work').textContent = workName || '';
            document.getElementById('result-agreement').textContent = agreementNo || '';
            document.getElementById('result-commencement').textContent = formatDate(commencementDate);
            document.getElementById('result-stipulated').textContent = formatDate(stipulatedDate);
            document.getElementById('result-actual').textContent = formatDate(actualDate);
            document.getElementById('result-mbno').textContent = mbNo || '';
            document.getElementById('result-deposit-amount').textContent = total ? total.toLocaleString('en-IN') : '';
            document.getElementById('result-total').textContent = total ? total.toLocaleString('en-IN') : '';
            document.getElementById('result-inspection-date').textContent = formatDate(inspectionDate);
            document.getElementById('result-final-bill-date').textContent = formatDate(finalBillDate);
            document.getElementById('result-dlp-expiry-date').textContent = formatDate(dlpExpiryDate);

            const resultDepositRows = document.getElementById('result-deposit-rows');
            resultDepositRows.innerHTML = '';
            depositDetails.forEach(detail => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${detail.type}</td>
                    <td>${detail.mb}</td>
                    <td>${detail.sd}</td>
                    <td>${detail.amount ? '₹' + detail.amount : ''}</td>
                `;
                resultDepositRows.appendChild(row);
            });

            document.getElementById('result').style.display = 'block';
        }

        function printReport() {
            const resultDiv = document.getElementById('result');
            if (resultDiv.style.display !== 'block') {
                alert('Please generate the report first by clicking "Generate Report".');
                return;
            }
            setTimeout(() => {
                window.print();
            }, 100);
        }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="add-bill"]').forEach(control => {
        control.addEventListener('click', addBill);
    });
    document.querySelectorAll('[data-action="remove-bill"]').forEach(control => {
        control.addEventListener('click', removeBill);
    });
    document.querySelectorAll('[data-action="generate"]').forEach(control => {
        control.addEventListener('click', generateReport);
    });
    document.querySelectorAll('[data-action="print"]').forEach(control => {
        control.addEventListener('click', printReport);
    });

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-action="remove-this-bill"]');
        if (button) removeThisBill(button);
    });
});
