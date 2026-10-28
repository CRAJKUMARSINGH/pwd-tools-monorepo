// Placeholder page for Enrollment Data Form – will be replaced with actual implementation if needed.
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function EnrollmentDataForm() {
  useDocumentTitle("Enrollment Data");

  return (
    <ToolShell title="Enrollment Data">
      <div style={{ padding: "2rem" }}>
        <h1>Enrollment Data Form</h1>
        <p>This tool allows you to collect enrollment details and generate a printable summary.</p>
      </div>
    </ToolShell>
  );
}
