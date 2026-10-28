import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import SpeedMoneyForm from "@/pages/SpeedMoneyForm";

export default function SpeedMoneyTool() {
  useDocumentTitle("Speed Money");
  return (
    <ToolShell title="Speed Money">
      <SpeedMoneyForm />
    </ToolShell>
  );
}
