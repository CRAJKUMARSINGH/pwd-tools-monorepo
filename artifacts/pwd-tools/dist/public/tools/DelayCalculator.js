        // Set default dates for demonstration
        window.onload = function() {
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setMonth(today.getMonth() - 2);

            document.getElementById('scheduledStart').value = twoMonthsAgo.toISOString().split('T')[0];
            document.getElementById('scheduledCompletion').value = oneMonthAgo.toISOString().split('T')[0];
            document.getElementById('actualCompletion').value = today.toISOString().split('T')[0];
        };

        function formatDate(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        function calculateDelay() {
            const scheduledStartInput = document.getElementById('scheduledStart').value;
            const scheduledCompletionInput = document.getElementById('scheduledCompletion').value;
            const actualCompletionInput = document.getElementById('actualCompletion').value;

            const scheduledStart = new Date(scheduledStartInput);
            const scheduledCompletion = new Date(scheduledCompletionInput);
            const actualCompletion = new Date(actualCompletionInput);

            if (isNaN(scheduledStart) || isNaN(scheduledCompletion) || isNaN(actualCompletion)) {
                document.getElementById('result').textContent = "Please enter valid dates.";
                document.getElementById('result').style.color = "#e74c3c";
                return;
            }

            if (actualCompletion < scheduledCompletion) {
                document.getElementById('result').textContent = "Actual completion cannot be before scheduled completion.";
                document.getElementById('result').style.color = "#e74c3c";
                return;
            }

            const delayMilliseconds = actualCompletion - scheduledCompletion;

            const years = Math.floor(delayMilliseconds / (1000 * 60 * 60 * 24 * 365.25));
            const remainingMilliseconds = delayMilliseconds % (1000 * 60 * 60 * 24 * 365.25);
            const months = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24 * 30.44));
            const days = Math.floor((remainingMilliseconds % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));

            const formattedScheduledStart = formatDate(scheduledStart);
            const formattedScheduledCompletion = formatDate(scheduledCompletion);
            const formattedActualCompletion = formatDate(actualCompletion);

            document.getElementById('result').innerHTML = `
                <strong>Delay Calculation Results:</strong><br>
                Scheduled Start: ${formattedScheduledStart}<br>
                Scheduled Completion: ${formattedScheduledCompletion}<br>
                Actual Completion: ${formattedActualCompletion}<br>
                <strong>Delay: ${years} years, ${months} months, ${days} days</strong>
            `;
            document.getElementById('result').style.color = "#333";
        }

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="calculate"]').forEach(control => {
        control.addEventListener('click', calculateDelay);
    });
});
