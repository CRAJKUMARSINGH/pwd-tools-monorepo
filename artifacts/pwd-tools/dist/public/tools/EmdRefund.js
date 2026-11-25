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

        function generateReceiptHTML(payee, amount, work) {
            const amountInWords = convertNumberToWords(parseFloat(amount));
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
                    <p>(3) Pay for ECS Rs.${amount}/- (Rupees <span class="amount-words">${amountInWords} only</span>)</p>
                    <p>(4) Paid by me</p>
                    <p>(5) Received from The Executive Engineer PWD District Division-II, Udaipur the sum of Rs. ${amount}/- (Rupees <span class="amount-words">${amountInWords} only</span>)</p>
                    <p>Name of work for which payment is made: <span class="input-field">${escapeHtml(work)}</span></p>
                    <p>Chargeable to Head:- 8443 [EMD-Refund]</p>
                    <table class="signature-area">
                        <tr>
                            <td>Witness</td>
                            <td>Stamp</td>
                            <td>Signature of payee</td>
                        </tr>
                        <tr>
                            <td>Cash Book No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Page No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>
                    <table class="offices">
                        <tr>
                            <td>For use in the Divisional Office</td>
                            <td>For use in the Accountant General's office</td>
                        </tr>
                        <tr>
                            <td>Checked</td>
                            <td>Audited/Reviewed</td>
                        </tr>
                        <tr>
                            <td>Accounts Clerk</td>
                            <td>DA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Auditor &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Supdt. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; G.O.</td>
                        </tr>
                    </table>
                </div>
                <div class="seal-container" style="display:none;"></div>
                <div class="bottom-left-box">
                    <div class="box-title">✦ For Office Use — Passed / Approved</div>
                    <p class="blue-text">Passed for Rs. ${amount}</p>
                    <p class="blue-text">In Words Rupees: ${amountInWords} Only</p>
                    <p class="blue-text">Chargeable to Head:- 8443 [EMD-Refund]</p>
                    <div class="seal-row">
                        <div class="seal-item">
                            <div class="sig-line"></div>
                            <div class="sig-label">Ar.</div>
                        </div>
                        <div class="seal-item">
                            <div class="sig-line"></div>
                            <div class="sig-label">D.A.</div>
                        </div>
                        <div class="seal-item">
                            <div class="sig-line"></div>
                            <div class="sig-label">E.E.</div>
                        </div>
                    </div>
                </div>
            `;
        }

        document.getElementById('generate-button').addEventListener('click', function () {
            const payee = document.getElementById('payee').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const work = document.getElementById('work').value.trim();

            if (!payee || !Number.isFinite(amount) || amount <= 0 || !work) {
                const btn = document.getElementById('generate-button');
                btn.style.transition = 'transform 0.08s';
                const shakes = ['-5px', '5px', '-5px', '5px', '0px'];
                shakes.forEach((v, i) => {
                    setTimeout(() => { btn.style.transform = `translateX(${v})`; }, i * 70);
                });
                setTimeout(() => { btn.style.transform = ''; }, 420);
                alert("Please fill in all fields. Amount must be greater than zero.");
                return;
            }

            document.getElementById('receipt-content').innerHTML = generateReceiptHTML(payee, amount, work);
            document.getElementById('prompt-container').style.display = 'none';
            document.getElementById('receipt-wrapper').style.display = 'block';

            // Reset body to normal flow so receipt aligns from the top
            document.body.style.display = 'block';
            document.body.style.alignItems = '';
            document.body.style.justifyContent = '';
            document.body.style.padding = '0';

            const printBtn = document.getElementById('print-btn');
            printBtn.style.display = 'flex';

            setTimeout(function () { window.print(); }, 300);
        });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="print"]').forEach(control => {
        control.addEventListener('click', () => window.print());
    });
});
