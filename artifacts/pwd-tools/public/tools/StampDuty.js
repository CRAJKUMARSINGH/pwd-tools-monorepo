        function calculateStampDuty() {
            let workOrderAmount = parseFloat(document.getElementById("workOrderAmount").value);

            if (isNaN(workOrderAmount) || workOrderAmount <= 0) {
                document.getElementById("result").innerHTML = "Please enter a valid amount";
                return;
            }

            let stampDuty;

            if (workOrderAmount <= 5000000) {
                stampDuty = 1000;
            } else {
                stampDuty = Math.round(workOrderAmount * 0.0015);
                if (stampDuty > 2500000) {
                    stampDuty = 2500000;
                }
            }

            document.getElementById("result").innerHTML = "Stamp Duty: Rs. " + stampDuty.toLocaleString("en-IN");
        }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="calculate"]').forEach(control => {
        control.addEventListener('click', calculateStampDuty);
    });
});
