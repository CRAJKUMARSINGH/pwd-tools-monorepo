import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation } from "wouter";

import { lazy, Suspense } from "react";

const AuditReplyPage = lazy(() => import("@/pages/AuditReply"));
const BankCommunication = lazy(() => import("@/pages/BankCommunication"));
const BillForm = lazy(() => import("@/pages/BillForm"));
const ContractorRegistration = lazy(() => import("@/pages/ContractorRegistration"));
const CorrespondencePage = lazy(() => import("@/pages/Correspondence"));
const DataVaultPage = lazy(() => import("@/pages/DataVaultPage"));
const DocumentGenerator = lazy(() => import("@/pages/DocumentGenerator"));
const EnrollmentDataForm = lazy(() => import("@/pages/EnrollmentDataForm"));
const EotLetterPage = lazy(() => import("@/pages/EotLetterPage"));
const ExcelToEmd = lazy(() => import("@/pages/ExcelToEmd"));
const Home = lazy(() => import("@/pages/Home"));
const Ifms30BillInput = lazy(() => import("@/pages/Ifms30BillInput"));
const ImageCompressor = lazy(() => import("@/pages/ImageCompressor"));
const LegalCorrespondencePage = lazy(() => import("@/pages/LegalCorrespondence"));
const NoDuesPage = lazy(() => import("@/pages/NoDuesPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const NoticePage = lazy(() => import("@/pages/NoticePage"));
const RescissionNoticePage = lazy(() => import("@/pages/RescissionNoticePage"));
const SpeedMoneyTool = lazy(() => import("@/pages/SpeedMoneyTool"));
const ToolViewer = lazy(() => import("@/pages/ToolViewer"));
const WorkOrderPage = lazy(() => import("@/pages/WorkOrderPage"));

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary key={location}>
      <Suspense fallback={<p role="status" className="p-6 text-sm text-muted-foreground">Loading tool…</p>}>
        <Switch>
          <Route path="/">
            <Redirect to="/tool/hindi-bill-note-sheet" replace />
          </Route>
          <Route path="/home" component={Home} />
          <Route path="/tool/:id" component={ToolViewer} />
          {/* ── Correspondence ── */}
          <Route path="/audit-reply" component={AuditReplyPage} />
          <Route path="/data-vault" component={DataVaultPage} />
          <Route path="/correspondence" component={CorrespondencePage} />
          <Route path="/legal-correspondence" component={LegalCorrespondencePage} />
          {/* ── Bill & Financial ── */}
          <Route path="/ifms-3-bill-input" component={Ifms30BillInput} />
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
      </Suspense>
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
