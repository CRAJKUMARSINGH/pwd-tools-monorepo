        // Update current time (IST)
        document.getElementById('currentTime').textContent = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'medium'
        });

        document.getElementById('calcBtn').addEventListener('click', function () {
            const gsInput = document.getElementById('gsAmount');
            const woInput = document.getElementById('woAmount');
            const resultDiv = document.getElementById('result');

            const gs = parseFloat(gsInput.value);
            const wo = parseFloat(woInput.value);

            // Validation
            if (isNaN(gs) || isNaN(wo) || gs <= 0 || wo <= 0) {
                resultDiv.innerHTML = '<span style="color:red;">Please enter valid positive amounts.</span>';
                return;
            }

            // Calculate percentage difference
            const percentDiff = ((wo - gs) / gs) * 100;
            let apg = 0;

            if (percentDiff < -15) {
                const excessBelow = Math.abs(percentDiff) - 15;  // e.g. 20 - 15 = 5
                const amountBelow = (excessBelow / 100) * gs;   // 5% of 100 = 5
                apg = 0.5 * amountBelow;                        // 50% of 5 = 2.5
            }

            // Show result (rounded to nearest integer)
            resultDiv.innerHTML = `APG = <strong>₹${Math.round(apg)}</strong>`;

            // Optional: Add animation
            resultDiv.style.animation = 'pulse 0.3s';
            setTimeout(() => resultDiv.style.animation = '', 300);
        });

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
