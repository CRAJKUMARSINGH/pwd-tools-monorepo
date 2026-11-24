import { describe, expect, it } from "vitest";
import {
    calculateIfms30Bill,
    initialIfms30BillForm,
} from "./ifms30Bill";

describe("calculateIfms30Bill", () => {
    it("matches the existing Hindi bill deduction and rounding rules", () => {
        const result = calculateIfms30Bill({
            ...initialIfms30BillForm,
            totalWorkOrderAmount: "1255555",
            amountThisBill: "125255",
            miningRoyaltyOption: "B15",
            headWiseBifurcation: "yes",
        });

        expect(result.securityDeposit).toBe(12526);
        expect(result.incomeTax).toBe(2505);
        expect(result.gstDeduction).toBe(2506);
        expect(result.labourWelfare).toBe(1253);
        expect(result.miningRoyalty).toBe(1879);
        expect(result.dfmt).toBe(188);
        expect(result.totalDeductions).toBe(20857);
        expect(result.chequeAmount).toBe(104398);
        expect(result.total).toBe(125255);
        expect(result.progressPercent).toBe("9.98");
        expect(result.notePoints).toEqual(["1. कार्य 9.98 प्रतिशत संपादित हुआ है।"]);
        expect(result.bifurcationRows).toEqual([
            ["5054 — 337 (70%)", "Rs. 87,679"],
            ["5054 — 789 (17%)", "Rs. 21,293"],
            ["5054 — 796 (13%)", "Rs. 16,283"],
        ]);
    });

    it("applies C30 rates and itemizes Deposit-V", () => {
        const result = calculateIfms30Bill({
            ...initialIfms30BillForm,
            totalWorkOrderAmount: "200000",
            paymentUptoLastBill: "50000",
            amountThisBill: "100000",
            miningRoyaltyOption: "C30",
            depV: "500",
        });

        expect(result.progressPercent).toBe("75.00");
        expect(result.miningRoyalty).toBe(3000);
        expect(result.dfmt).toBe(300);
        expect(result.totalDeductions).toBe(18800);
        expect(result.chequeAmount).toBe(81200);
        expect(result.deductionRows).toContainEqual([
            "Deposit-Vth (8443) (8443-00-108-00-00)",
            "Rs. 500",
        ]);
    });

    it("omits mining rows when A0 is selected", () => {
        const result = calculateIfms30Bill({
            ...initialIfms30BillForm,
            amountThisBill: "100000",
            miningRoyaltyOption: "A0",
        });

        expect(result.miningRoyalty).toBe(0);
        expect(result.dfmt).toBe(0);
        expect(result.deductionRows.some(([label]) => label.includes("Royalty"))).toBe(false);
        expect(result.deductionRows.some(([label]) => label.includes("DMFT"))).toBe(false);
    });
});
