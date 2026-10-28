// ContractorRegistration component wrapping the DocumentGenerator form
import DocumentGenerator from "@/pages/DocumentGenerator";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ContractorRegistration() {
  useDocumentTitle("Contractor Enlistment Order");
  return <DocumentGenerator />;
}
