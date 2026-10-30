import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuditReplyPage from "@/pages/AuditReply";
import BankCommunication from "@/pages/BankCommunication";
import BillForm from "@/pages/BillForm";
import ContractorRegistration from "@/pages/ContractorRegistration";
import CorrespondencePage from "@/pages/Correspondence";
import DataVaultPage from "@/pages/DataVaultPage";
import DocumentGenerator from "@/pages/DocumentGenerator";
import EnrollmentDataForm from "@/pages/EnrollmentDataForm";
import EotLetterPage from "@/pages/EotLetterPage";
import ExcelToEmd from "@/pages/ExcelToEmd";
import Home from "@/pages/Home";
import ImageCompressor from "@/pages/ImageCompressor";
import LegalCorrespondencePage from "@/pages/LegalCorrespondence";
import NoDuesPage from "@/pages/NoDuesPage";
import NotFound from "@/pages/not-found";
import NoticePage from "@/pages/NoticePage";
import RescissionNoticePage from "@/pages/RescissionNoticePage";
import SpeedMoneyTool from "@/pages/SpeedMoneyTool";
import ToolViewer from "@/pages/ToolViewer";
import WorkOrderPage from "@/pages/WorkOrderPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary key={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tool/:id" component={ToolViewer} />
        {/* ── Correspondence ── */}
        <Route path="/audit-reply" component={AuditReplyPage} />
        <Route path="/data-vault" component={DataVaultPage} />
        <Route path="/correspondence" component={CorrespondencePage} />
        <Route path="/legal-correspondence" component={LegalCorrespondencePage} />
        {/* ── Bill & Financial ── */}
        <Route path="/bill-form" component={() => <BillForm />} />
        <Route path="/speed-money-tool" component={SpeedMoneyTool} />
        <Route path="/excel-to-emd" component={ExcelToEmd} />
        <Route path="/document-generator" component={DocumentGenerator} />
        <Route path="/enrollment-data" component={EnrollmentDataForm} />
        {/* ── Contractor ── */}
        <Route path="/contractor-registration" component={ContractorRegistration} />
        <Route path="/bank-communication" component={BankCommunication} />
        {/* ── New tools ── */}
        <Route path="/notice" component={NoticePage} />
        <Route path="/work-order" component={WorkOrderPage} />
        <Route path="/eot-letter" component={EotLetterPage} />
        <Route path="/rescission-notice" component={RescissionNoticePage} />
        <Route path="/no-dues" component={NoDuesPage} />
        <Route path="/image-compressor" component={ImageCompressor} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
