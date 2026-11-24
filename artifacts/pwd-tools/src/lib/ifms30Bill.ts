export type YesNo = "yes" | "no";
export type MiningRoyaltyOption = "A0" | "B15" | "C30";

export interface Ifms30BillForm {
    totalWorkOrderAmount: string;
    paymentUptoLastBill: string;
    amountThisBill: string;
    miningRoyaltyOption: MiningRoyaltyOption;
    depV: string;
    headWiseBifurcation: YesNo;
}

export type OutputRow = [label: string, value: string];

export interface Ifms30BillCalculation {
    workOrderAmount: number;
    lastBillAmount: number;
    thisBillAmount: number;
    actualExpenditure: number;
    progressPercent: string;
    incomeTax: number;
    gstDeduction: number;
    labourWelfare: number;
    securityDeposit: number;
    miningRoyalty: number;
    dfmt: number;
    depositV: number;
    totalDeductions: number;
    chequeAmount: number;
    total: number;
    deductionRows: OutputRow[];
    bifurcationRows: OutputRow[];
    notePoints: string[];
}

export const IFMS_FOOTER = "DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR";

export const initialIfms30BillForm: Ifms30BillForm = {
    totalWorkOrderAmount: "",
    paymentUptoLastBill: "0",
    amountThisBill: "",
    miningRoyaltyOption: "A0",
    depV: "0",
    headWiseBifurcation: "no",
};

function amount(value: string): number {
    return Number.parseFloat(value) || 0;
}

export function formatAmount(value: number): string {
    return value.toLocaleString("en-IN");
}

export function calculateIfms30Bill(form: Ifms30BillForm): Ifms30BillCalculation {
    const workOrderAmount = amount(form.totalWorkOrderAmount);
    const lastBillAmount = amount(form.paymentUptoLastBill);
    const thisBillAmount = amount(form.amountThisBill);
    const actualExpenditure = lastBillAmount + thisBillAmount;

    const progressPercent = workOrderAmount > 0
        ? ((actualExpenditure / workOrderAmount) * 100).toFixed(2)
        : "0.00";

    const incomeTax = Math.round(thisBillAmount * 0.02);
    const roundedGst = Math.round(thisBillAmount * 0.02);
    const gstDeduction = roundedGst % 2 === 0 ? roundedGst : roundedGst + 1;
    const labourWelfare = Math.round(thisBillAmount * 0.01);
    const securityDeposit = Math.round(thisBillAmount * 0.1);

    const miningRoyaltyRate = form.miningRoyaltyOption === "B15"
        ? 0.015
        : form.miningRoyaltyOption === "C30"
            ? 0.03
            : 0;
    const dfmtRate = form.miningRoyaltyOption === "B15"
        ? 0.0015
        : form.miningRoyaltyOption === "C30"
            ? 0.003
            : 0;

    const miningRoyalty = Math.round(thisBillAmount * miningRoyaltyRate);
    const dfmt = Math.round(thisBillAmount * dfmtRate);
    const depositV = amount(form.depV);

    const totalDeductions = incomeTax
        + gstDeduction
        + labourWelfare
        + securityDeposit
        + miningRoyalty
        + dfmt
        + depositV;
    const chequeAmount = thisBillAmount - totalDeductions;
    const total = totalDeductions + chequeAmount;

    const deductionRows: OutputRow[] = [
        ["Income Tax (8658-00-112-00-00)", `Rs. ${formatAmount(incomeTax)}`],
        ["GSTIN Deduction (8658-00-139-00-00)", `Rs. ${formatAmount(gstDeduction)}`],
        ...(dfmt > 0
            ? [["PD Account (DMFT) 8342 (8342-00-120-65-00)", `Rs. ${formatAmount(dfmt)}`] as OutputRow]
            : []),
        ["Labour Welfare (0230-00-800-06-00)", `Rs. ${formatAmount(labourWelfare)}`],
        ...(miningRoyalty > 0
            ? [["Mines & Minerals / Royalty (0853-00-102-01-01)", `Rs. ${formatAmount(miningRoyalty)}`] as OutputRow]
            : []),
        ["Deposit-II (SD2) (8443) (8443-00-108-00-00)", `Rs. ${formatAmount(securityDeposit)}`],
        ...(depositV > 0
            ? [["(M.D.) Deposit-Vth (MD5) (8443) (8443-00-108-00-00)", `Rs. ${formatAmount(depositV)}`] as OutputRow]
            : []),
        ["Cheque / Amount", `Rs. ${formatAmount(chequeAmount)}`],
        ["Total", `Rs. ${formatAmount(total)}`],
    ];

    const bifurcationRows: OutputRow[] = form.headWiseBifurcation === "yes"
        ? [
            ["5054 — 337 (70%)", `Rs. ${formatAmount(Math.round(thisBillAmount * 0.7))}`],
            ["5054 — 789 (17%)", `Rs. ${formatAmount(Math.round(thisBillAmount * 0.17))}`],
            ["5054 — 796 (13%)", `Rs. ${formatAmount(Math.round(thisBillAmount * 0.13))}`],
        ]
        : [];

    return {
        workOrderAmount,
        lastBillAmount,
        thisBillAmount,
        actualExpenditure,
        progressPercent,
        incomeTax,
        gstDeduction,
        labourWelfare,
        securityDeposit,
        miningRoyalty,
        dfmt,
        depositV,
        totalDeductions,
        chequeAmount,
        total,
        deductionRows,
        bifurcationRows,
        notePoints: [`1. कार्य ${progressPercent} प्रतिशत संपादित हुआ है।`],
    };
}
