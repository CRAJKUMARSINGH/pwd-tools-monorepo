        window.addEventListener('error', function (e) {
            if (e.message.includes('NetworkError')) {
                console.log('Network error handled');
                return true;
            }
        });

        let customDeductions = [];
        let royaltyOption = 'A0'; // default

        // ── Royalty option selector ──────────────────────────────────────────
        function setRoyaltyOption(opt) {
            royaltyOption = opt;
            ['A0', 'B15', 'C30'].forEach(function (o) {
                var btn = document.getElementById('btn-' + o);
                btn.className = 'royalty-btn';
            });
            var activeClass = opt === 'A0' ? 'active-a0' : opt === 'B15' ? 'active-b15' : 'active-c30';
            document.getElementById('btn-' + opt).classList.add(activeClass);

            var info = document.getElementById('royaltyInfo');
            if (opt === 'A0') {
                info.textContent = '';
            } else {
                var royaltyPct = opt === 'B15' ? '1.5%' : '3%';
                var dfmtPct = opt === 'B15' ? '0.15%' : '0.3%';
                info.textContent = '\u25b6 Mines & Minerals / Royalty: ' + royaltyPct + '  |  PD Account (DMFT): ' + dfmtPct;
            }
        }

        // ── Currency formatter ───────────────────────────────────────────────
        function formatIndianCurrency(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2
            }).format(amount);
        }

        // ── Round to next even (used for GST only) ───────────────────────────
        function roundToEven(num) {
            var r = Math.round(num);
            return (r % 2 !== 0) ? r + 1 : r;
        }

        // ── Validation ───────────────────────────────────────────────────────
        function validateForm() {
            var isValid = true;
            var amount = parseFloat(document.getElementById('amount').value);
            var dvDeduction = parseFloat(document.getElementById('dv_deduction').value);

            document.getElementById('amountError').style.display = 'none';
            document.getElementById('dvError').style.display = 'none';

            if (isNaN(amount) || amount <= 0) {
                document.getElementById('amountError').textContent = 'Please enter a valid bill amount greater than zero';
                document.getElementById('amountError').style.display = 'block';
                isValid = false;
            }

            if (dvDeduction !== 0 && (isNaN(dvDeduction) || dvDeduction < 0)) {
                document.getElementById('dvError').textContent = 'Please enter a valid (M.D.)Deposit-Vth (MD5) amount (must be zero or positive)';
                document.getElementById('dvError').style.display = 'block';
                isValid = false;
            }

            return isValid;
        }

        // ── Generate Table ───────────────────────────────────────────────────
        function generateTable() {
            if (!validateForm()) return;

            var amount = parseFloat(document.getElementById('amount').value);
            var dvDeduction = parseFloat(document.getElementById('dv_deduction').value) || 0;

            // Fixed rates
            var itRate = 2;   // Income Tax
            var gstRate = 2;   // GSTIN Deduction
            var lcRate = 1;   // Labour Welfare
            var sdRate = 10;  // Deposit-II (SD2)

            // Mining Royalty & DFMT rates — based on A0/B15/C30 (matching BillForm.tsx logic)
            var miningRoyaltyPct = royaltyOption === 'B15' ? 1.5 : royaltyOption === 'C30' ? 3 : 0;
            var dfmtPct = royaltyOption === 'B15' ? 0.15 : royaltyOption === 'C30' ? 0.3 : 0;

            // Special handling for GST — round to next even number
            var gstAmount = roundToEven(amount * gstRate / 100);

            // Build deductions in prescribed order
            var deductions = [];

            // 1. Income Tax @ 2%
            deductions.push({ type: "Income Tax (8658-00-112-00-00)", rate: itRate + "%", amount: Math.round(amount * itRate / 100) });

            // 2. GSTIN Deduction @ 2%
            deductions.push({ type: "GSTIN Deduction (8658-00-139-00-00)", rate: gstRate + "%", amount: gstAmount });

            // 3. PD Account (DMFT) — only for B15 / C30
            if (royaltyOption !== 'A0') {
                deductions.push({ type: "PD Account (DMFT) 8342 (8342-00-120-65-00)", rate: dfmtPct + "%", amount: Math.round(amount * dfmtPct / 100) });
            }

            // 4. Labour Welfare @ 1%
            deductions.push({ type: "Labour Welfare (0230-00-800-06-00)", rate: lcRate + "%", amount: Math.round(amount * lcRate / 100) });

            // 5. Mines & Minerals / Royalty — only for B15 / C30
            if (royaltyOption !== 'A0') {
                deductions.push({ type: "Mines & Minerals / Royalty (0853-00-102-01-01)", rate: miningRoyaltyPct + "%", amount: Math.round(amount * miningRoyaltyPct / 100) });
            }

            // 6. Deposit-II (SD2) @ 10%
            deductions.push({ type: "Deposit-II (SD2) (8443) (8443-00-108-00-00)", rate: sdRate + "%", amount: Math.round(amount * sdRate / 100) });

            // 7. (M.D.)Deposit-Vth (MD5) — fixed input
            deductions.push({ type: "(M.D.)Deposit-Vth (MD5) (8443) (8443-00-108-00-00)", rate: "-", amount: dvDeduction });

            // Append any custom deductions
            customDeductions.forEach(function (item) { deductions.push(item); });

            // ── Build table ──────────────────────────────────────────────────
            var table = document.createElement('table');
            table.className = 'fade-in';

            var headerRow = table.insertRow();
            ["S.No.", "Deduction Type", "Percentage / Rate", "Deduction Amount (\u20b9)"].forEach(function (text) {
                var th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });

            var totalDeduction = 0;
            var serialNo = 1;

            deductions.forEach(function (item) {
                var row = table.insertRow();

                var c1 = row.insertCell(); c1.textContent = serialNo++;
                var c2 = row.insertCell(); c2.textContent = item.type;
                var c3 = row.insertCell(); c3.textContent = item.rate;
                var c4 = row.insertCell();
                c4.textContent = formatIndianCurrency(item.amount);
                c4.className = 'amount-cell';

                totalDeduction += item.amount;

                if (item.isCustom) { row.className = 'custom-deduction'; }
            });

            // Cheque row
            var chequeAmount = Math.round(amount - totalDeduction);
            var chequeRow = table.insertRow();
            chequeRow.className = 'cheque-row';
            [serialNo++, "CHEQUE", "-", formatIndianCurrency(chequeAmount)].forEach(function (text, i) {
                var cell = chequeRow.insertCell();
                cell.textContent = text;
                if (i === 3) cell.className = 'amount-cell';
            });

            // Total row
            var totalRow = table.insertRow();
            totalRow.className = 'total-row';
            ["-", "TOTAL", "-", formatIndianCurrency(amount)].forEach(function (text, i) {
                var cell = totalRow.insertCell();
                cell.textContent = text;
                if (i === 3) cell.className = 'amount-cell';
            });

            // Display
            var tableContainer = document.getElementById('tableContainer');
            tableContainer.innerHTML = '';
            tableContainer.appendChild(table);
            tableContainer.style.display = 'block';

            // Clone for print
            var printTableContainer = document.getElementById('printTableContainer');
            var printTable = table.cloneNode(true);
            printTable.className = 'print-table';
            printTableContainer.innerHTML = '';
            printTableContainer.appendChild(printTable);

            var successMessage = document.getElementById('successMessage');
            successMessage.textContent = 'Deductions table generated successfully!';
            successMessage.style.display = 'block';
            setTimeout(function () { successMessage.style.display = 'none'; }, 5000);
        }

        // ── Reset ────────────────────────────────────────────────────────────
        function resetForm() {
            document.getElementById('amount').value = '';
            document.getElementById('dv_deduction').value = '';
            document.getElementById('amountError').style.display = 'none';
            document.getElementById('dvError').style.display = 'none';
            document.getElementById('tableContainer').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
            customDeductions = [];
            setRoyaltyOption('A0');
        }

        // ── Print ────────────────────────────────────────────────────────────
        function printResults() {
            if (document.getElementById('tableContainer').style.display === 'none') {
                alert('Please generate a deductions table first.');
                return;
            }
            document.getElementById('printArea').style.display = 'block';
            window.print();
        }

        // ── Custom Deduction Modal ────────────────────────────────────────────
        function openCustomDeductionModal() {
            document.getElementById('customName').value = '';
            document.getElementById('customPercentage').value = '';
            document.getElementById('customAmount').value = '';
            document.getElementById('deductionType').value = 'percentage';
            document.getElementById('percentageInput').style.display = 'block';
            document.getElementById('fixedInput').style.display = 'none';
            document.getElementById('customDeductionModal').style.display = 'block';
        }

        function closeCustomDeductionModal() {
            document.getElementById('customDeductionModal').style.display = 'none';
        }

        document.getElementById('deductionType').addEventListener('change', function () {
            if (this.value === 'percentage') {
                document.getElementById('percentageInput').style.display = 'block';
                document.getElementById('fixedInput').style.display = 'none';
            } else {
                document.getElementById('percentageInput').style.display = 'none';
                document.getElementById('fixedInput').style.display = 'block';
            }
        });

        function addCustomDeduction() {
            var deductionName = document.getElementById('customName').value.trim();
            var deductionType = document.getElementById('deductionType').value;
            var amount = parseFloat(document.getElementById('amount').value);

            if (!deductionName) { alert('Please enter a name for the deduction'); return; }
            if (!amount) { alert('Please enter the bill amount first'); return; }

            var customDeduction = { type: deductionName, isCustom: true };

            if (deductionType === 'percentage') {
                var percentage = parseFloat(document.getElementById('customPercentage').value);
                if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                    alert('Please enter a valid percentage between 0 and 100');
                    return;
                }
                customDeduction.rate = percentage + '%';
                customDeduction.amount = Math.round(amount * percentage / 100);
            } else {
                var fixedAmount = parseFloat(document.getElementById('customAmount').value);
                if (isNaN(fixedAmount) || fixedAmount < 0) {
                    alert('Please enter a valid amount');
                    return;
                }
                customDeduction.rate = '-';
                customDeduction.amount = fixedAmount;
            }

            customDeductions.push(customDeduction);
            closeCustomDeductionModal();

            if (document.getElementById('tableContainer').style.display !== 'none') {
                generateTable();
            }

            var successMessage = document.getElementById('successMessage');
            successMessage.textContent = 'Custom deduction "' + deductionName + '" added successfully!';
            successMessage.style.display = 'block';
            setTimeout(function () { successMessage.style.display = 'none'; }, 3000);
        }

        window.onclick = function (event) {
            var modal = document.getElementById('customDeductionModal');
            if (event.target === modal) { closeCustomDeductionModal(); }
        };

        // Real-time validation
        document.querySelectorAll('input').forEach(function (input) {
            input.addEventListener('input', function () {
                if (this.id === 'amount') {
                    var v = parseFloat(this.value);
                    if (!isNaN(v) && v > 0) document.getElementById('amountError').style.display = 'none';
                }
                if (this.id === 'dv_deduction') {
                    var v = parseFloat(this.value);
                    if (!isNaN(v) && v >= 0) document.getElementById('dvError').style.display = 'none';
                }
            });
        });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="royalty-a0"]').forEach(control => {
        control.addEventListener('click', () => setRoyaltyOption("A0"));
    });
    document.querySelectorAll('[data-action="royalty-b15"]').forEach(control => {
        control.addEventListener('click', () => setRoyaltyOption("B15"));
    });
    document.querySelectorAll('[data-action="royalty-c30"]').forEach(control => {
        control.addEventListener('click', () => setRoyaltyOption("C30"));
    });
    document.querySelectorAll('[data-action="generate"]').forEach(control => {
        control.addEventListener('click', generateTable);
    });
    document.querySelectorAll('[data-action="open-custom"]').forEach(control => {
        control.addEventListener('click', openCustomDeductionModal);
    });
    document.querySelectorAll('[data-action="reset"]').forEach(control => {
        control.addEventListener('click', resetForm);
    });
    document.querySelectorAll('[data-action="print"]').forEach(control => {
        control.addEventListener('click', printResults);
    });
    document.querySelectorAll('[data-action="close-custom"]').forEach(control => {
        control.addEventListener('click', closeCustomDeductionModal);
    });
    document.querySelectorAll('[data-action="add-custom"]').forEach(control => {
        control.addEventListener('click', addCustomDeduction);
    });
});
