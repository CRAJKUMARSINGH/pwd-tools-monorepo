        const MAX_ROWS = 50;
        let selectedFile = null;
        let lastReceiptHTML = '';

        function convertNumberToWords(num) {
            const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
            const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
            const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

            if (num === 0) return "Zero";
            let words = "";

            if (Math.floor(num / 10000000)) { words += convertNumberToWords(Math.floor(num / 10000000)) + " Crore "; num %= 10000000; }
            if (Math.floor(num / 100000)) { words += convertNumberToWords(Math.floor(num / 100000)) + " Lakh "; num %= 100000; }
            if (Math.floor(num / 1000)) { words += convertNumberToWords(Math.floor(num / 1000)) + " Thousand "; num %= 1000; }
            if (Math.floor(num / 100)) { words += convertNumberToWords(Math.floor(num / 100)) + " Hundred "; num %= 100; }
            if (num > 0) {
                if (words !== "") words += " and ";
                if (num < 10) words += ones[num];
                else if (num < 20) words += teens[num - 10];
                else {
                    words += tens[Math.floor(num / 10)];
                    if (num % 10 > 0) words += " " + ones[num % 10];
                }
            }
            return words.trim();
        }

        function findColumn(columns, possibleNames) {
            for (const name of possibleNames) {
                const nameLower = name.toLowerCase();
                for (const col of columns) {
                    if (String(col).trim().toLowerCase().includes(nameLower)) return col;
                }
            }
            return null;
        }

        function generateReceiptHTML(payee, amount, work) {
            const amountStr = parseFloat(amount).toFixed(2);
            const amountInWords = convertNumberToWords(Math.floor(parseFloat(amount)));
            return `
                <div class="header">
                    <h2>Payable to: - ${escapeHtml(payee)}</h2>
                    <h2>HAND RECEIPT (RPWA 28)</h2>
                    <p>(Referred to in PWF&amp;A Rules 418,424,436 &amp; 438)</p>
                    <p>Division - PWD District Division-II, Udaipur</p>
                </div>
                <div class="details">
                    <p>(1) Cash Book Voucher No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>(2) Cheque No. and Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>(3) Pay for ECS Rs.${amountStr}/- (Rupees <span class="amount-words">${amountInWords} only</span>)</p>
                    <p>(4) Paid by me</p>
                    <p>(5) Received from The Executive Engineer PWD District Division-II, Udaipur the sum of Rs. ${amountStr}/- (Rupees <span class="amount-words">${amountInWords} only</span>)</p>
                    <p>Name of work for which payment is made: <span class="input-field">${escapeHtml(work)}</span></p>
                    <p>Chargeable to Head:- 8443 [EMD-Refund]</p>
                    <table class="signature-area">
                        <tr><td>Witness</td><td>Stamp</td><td>Signature of payee</td></tr>
                        <tr><td>Cash Book No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Page No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td></td><td></td></tr>
                    </table>
                    <table class="offices">
                        <tr><td>For use in the Divisional Office</td><td>For use in the Accountant General's office</td></tr>
                        <tr><td>Checked</td><td>Audited/Reviewed</td></tr>
                        <tr><td>Accounts Clerk</td><td>DA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Auditor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Supdt. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; G.O.</td></tr>
                    </table>
                </div>
                <div class="seal-container"><div class="seal"><p></p><p></p><p></p></div></div>
                <div class="bottom-left-box">
                    <p class="blue-text">Passed for Rs. ${amountStr}</p>
                    <p class="blue-text">In Words Rupees: ${amountInWords} Only</p>
                    <p class="blue-text">Chargeable to Head:- 8443 [EMD-Refund]</p>
                    <div class="seal"><p>Ar.</p><p>D.A.</p><p>E.E.</p></div>
                </div>
            `;
        }

        function showStatus(message, type) {
            const el = document.getElementById('status-msg');
            el.textContent = message;
            el.className = type;
        }

        function clearStatus() {
            const el = document.getElementById('status-msg');
            el.textContent = '';
            el.className = '';
        }

        function handleFileSelect(file) {
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.xlsx')) {
                showStatus('Please upload a .xlsx Excel file.', 'error');
                return;
            }
            selectedFile = file;
            document.getElementById('generate-button').disabled = false;
            document.getElementById('clear-button').style.display = 'block';
            document.getElementById('file-selected').style.display = 'block';
            document.getElementById('file-selected').textContent = `📁 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            clearStatus();
        }

        function parseExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const sheet = workbook.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).slice(0, MAX_ROWS);
                        resolve(rows);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            });
        }

        function processRows(rows) {
            if (!rows.length) throw new Error('Excel file is empty.');

            const columns = Object.keys(rows[0]);
            const payeeCol = findColumn(columns, ['Payee Name', 'PayeeName', 'Name', 'Contractor', 'Payee']);
            const amountCol = findColumn(columns, ['Amount', 'Value', 'Cost', 'Payment', 'Total']);
            const workCol = findColumn(columns, ['Work', 'Description', 'Item', 'Project', 'Job']);

            const missing = [];
            if (!payeeCol) missing.push('Payee Name');
            if (!amountCol) missing.push('Amount');
            if (!workCol) missing.push('Work');
            if (missing.length) throw new Error('Missing required columns: ' + missing.join(', '));

            const receipts = [];
            for (const row of rows) {
                try {
                    const payee = String(row[payeeCol] || '').trim();
                    const amount = parseFloat(row[amountCol]);
                    const work = String(row[workCol] || '').trim();
                    if (payee && Number.isFinite(amount) && amount > 0 && work) {
                        receipts.push({ payee, amount, work });
                    }
                } catch (_) { /* skip invalid row */ }
            }

            if (!receipts.length) throw new Error('No valid rows found. Check Payee, Amount, and Work values.');
            return receipts;
        }

        function renderReceipts(receipts) {
            const wrapper = document.getElementById('receipt-wrapper');
            const html = receipts.map(r =>
                `<div class="receipt-page">${generateReceiptHTML(r.payee, r.amount, r.work)}</div>`
            ).join('');
            wrapper.innerHTML = html;
            lastReceiptHTML = html;
        }

        function resetToUpload() {
            document.getElementById('prompt-container').style.display = 'block';
            document.getElementById('receipt-wrapper').style.display = 'none';
            document.getElementById('receipt-actions').style.display = 'none';
            document.getElementById('receipt-wrapper').innerHTML = '';
            lastReceiptHTML = '';
            // Reset body layout for upload card centering
            document.body.style.display = 'flex';
            document.body.style.alignItems = 'center';
            document.body.style.justifyContent = 'center';
        }

        function doPrint() {
            // Try native print first (works if NOT in a sandboxed iframe)
            try {
                window.print();
                return;
            } catch (e) { /* sandboxed iframe — fall through */ }

            // Fallback: open popup with receipts and print from there
            const printWindow = window.open('', '_blank', 'width=900,height=700');
            if (!printWindow) {
                alert('Please allow popups for this site to enable PDF printing.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hand Receipts (RPWA 28)</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:white;margin:0;padding:0}
#receipt-wrapper{width:210mm;margin:0;padding:10mm 12mm;box-sizing:border-box}
.receipt-page{width:100%;min-height:297mm;border:none;padding:0;box-sizing:border-box;position:relative;background:white;page-break-after:always;break-after:page}
.receipt-page:last-child{page-break-after:auto;break-after:auto}
.header{text-align:center;margin-bottom:2px}
.header h2{margin:3px 0;font-size:14px}
.header p{margin:2px 0;font-size:12px}
.details p{margin:3px 0;font-size:12px}
.amount-words{font-style:italic}
.signature-area{width:100%;border-collapse:collapse;margin-top:20px}
.signature-area td,.signature-area th{border:1px solid #ccc;padding:5px;text-align:left;font-size:12px}
.offices{width:100%;border-collapse:collapse;margin-top:20px}
.offices td,.offices th{border:1px solid black;padding:5px;text-align:left;word-wrap:break-word;font-size:12px}
.input-field{border:none;padding:3px;display:inline-block}
.seal-container{position:absolute;left:10mm;bottom:10mm;width:40mm;height:25mm;z-index:10}
.seal{max-width:100%;max-height:100%;text-align:center;line-height:40mm;color:blue;display:flex;justify-content:space-around;align-items:center}
.bottom-left-box{position:absolute;bottom:105mm;left:40mm;border:2px solid black;padding:10px;width:300px;text-align:left;height:auto}
.bottom-left-box p{margin:3px 0;font-size:12px}
.bottom-left-box .blue-text{color:blue}
@page{size:A4 portrait;margin:0 !important}
@media print{
  html,body{margin:0;padding:0;width:210mm;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .input-field{border:none}
}
</style>
</head>
<body>
<div id="receipt-wrapper">${lastReceiptHTML}</div>
</body>
</html>`);
            printWindow.document.close();
            printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true });
            printWindow.print();
        }

        // File input / drag-drop wiring
        const fileInput = document.getElementById('excel-file');
        const fileDrop = document.getElementById('file-drop');

        fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

        fileDrop.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDrop.classList.add('dragover');
        });

        fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));

        fileDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDrop.classList.remove('dragover');
            handleFileSelect(e.dataTransfer.files[0]);
        });

        document.getElementById('generate-button').addEventListener('click', async function () {
            if (!selectedFile) {
                showStatus('Please select an Excel file first.', 'error');
                return;
            }

            const btn = this;
            btn.disabled = true;
            btn.textContent = '⏳ Processing…';
            clearStatus();

            try {
                const rows = await parseExcelFile(selectedFile);
                const receipts = processRows(rows);
                renderReceipts(receipts);

                // Switch view: hide upload card, show receipts + action bar
                document.getElementById('prompt-container').style.display = 'none';
                document.getElementById('receipt-wrapper').style.display = 'block';
                document.getElementById('receipt-actions').style.display = 'flex';

                // Remove centering from body so receipts are left-aligned
                document.body.style.display = 'block';
                document.body.style.alignItems = '';
                document.body.style.justifyContent = '';

                // Attempt direct print (works when run as standalone, not in iframe)
                setTimeout(() => {
                    try { window.print(); } catch(e) { /* in iframe — user can click Print button */ }
                }, 400);

            } catch (err) {
                showStatus('❌ ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '🪔&nbsp; Generate Hand Receipts';
            }
        });

        document.getElementById('clear-button').addEventListener('click', () => {
            selectedFile = null;
            fileInput.value = '';
            document.getElementById('generate-button').disabled = true;
            document.getElementById('clear-button').style.display = 'none';
            document.getElementById('file-selected').style.display = 'none';
            clearStatus();
        });

        document.getElementById('back-btn-inline').addEventListener('click', resetToUpload);
        document.getElementById('print-btn-inline').addEventListener('click', doPrint);
