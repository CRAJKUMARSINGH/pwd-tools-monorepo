import BankCommunicationGenerator from '@/pages/BankCommunicationGenerator';
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";

export default function BankCommunication() {
  useDocumentTitle("Bank Communication");
  usePrintPage();
  return (
    <ToolShell title="Bank Communication">
      <BankCommunicationGenerator />
    </ToolShell>
  );
}
