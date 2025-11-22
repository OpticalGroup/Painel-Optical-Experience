import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { EnrollmentList, Enrollment } from "@/components/EnrollmentList";
import { EnrollmentModal, EnrollmentData } from "@/components/EnrollmentModal";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useCohortQuery } from "@/integrations/supabase/hooks/useCohorts";
import { useEnrollmentsQuery } from "@/integrations/supabase/hooks/useEnrollments";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CsvImportModal } from "@/components/CsvImportModal";
import { ExportButton } from "@/components/ExportButton";
import { UserMenu } from "@/components/UserMenu";

const CohortDetail = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cohortId } = useParams();

  const { data: cohort, isLoading: cohortLoading } = useCohortQuery(cohortId);
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollmentsQuery(cohortId);

  const isLoading = cohortLoading || enrollmentsLoading;

  // Map enrollments to the format expected by EnrollmentList
  const enrollments: Enrollment[] = (enrollmentsData || []).map(e => ({
    id: e.id,
    name: e.student_name,
    email: e.email,
    cpf: e.cpf,
    salesRep: e.sales_rep,
    source: e.source,
    paymentStatus: e.financial_status as "paid" | "pending",
    contractSigned: e.contract_status === "signed",
    paymentAmount: e.payment_amount ? Number(e.payment_amount) : undefined,
    paymentDetails: e.payment_details || undefined,
    phone: e.phone || undefined,
    address: e.address || undefined,
    city: e.city || undefined,
    state: e.state || undefined,
    zipcode: e.zipcode || undefined,
    purchaseDate: e.purchase_date || undefined,
    leadDate: e.lead_date || undefined,
    observations: e.observations || undefined,
    paymentProofUrl: e.payment_proof_url || undefined,
    productName: e.product_name || undefined,
    utmSource: e.utm_source || undefined,
    utmMedium: e.utm_medium || undefined,
    utmCampaign: e.utm_campaign || undefined,
    createdAt: e.created_at || undefined,
    updatedAt: e.updated_at || undefined,
    clicksignDocumentId: e.clicksign_document_id || undefined,
  }));

  const handleEnrollmentSubmit = (data: EnrollmentData) => {
    // Modal handles the mutation directly
  };

  const available = cohort?.stats?.available_spots || 0;
  const enrolled = cohort?.stats?.enrolled_count || 0;
  const paid = cohort?.stats?.paid_count || 0;
  const reserved = cohort?.stats?.reserved_count || 0;
  const signed = cohort?.stats?.signed_count || 0;
  const percentage = cohort ? (enrolled / cohort.capacity) * 100 : 0;
  const isOverbooked = percentage > 100;
  const waitlist = isOverbooked ? enrolled - cohort.capacity : 0;

  const chartData = [
    { name: "Pago", value: paid, color: "hsl(var(--primary))" },
    { name: "Reservado", value: reserved, color: "hsl(var(--secondary))" },
    { name: "Aberto", value: available > 0 ? available : 0, color: "hsl(var(--muted))" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cohorts')}
                  className="mr-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {isLoading ? (
                  <Skeleton className="h-12 w-64" />
                ) : cohort ? (
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {cohort.name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(new Date(cohort.start_date), "dd 'a' ", { locale: ptBR })}
                      {cohort.end_date && format(new Date(cohort.end_date), "dd/MM", { locale: ptBR })} • {cohort.location}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3">
                <ExportButton type="cohort-detail" cohortId={cohortId} label="Exportar Alunos" />
                <Button
                  variant="outline"
                  onClick={() => setCsvModalOpen(true)}
                  disabled={!cohort}
                  className="border-secondary hover:bg-secondary/10"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={() => setModalOpen(true)}
                  disabled={!cohort}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Matrícula
                </Button>
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Stats Card */}
          <section className="px-8 py-6">
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : cohort ? (
              <Card className="p-6 border border-border bg-card">
                <div className="flex items-center justify-between gap-12">
                  {/* Chart */}
                  <div className="relative w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">
                          {Math.round(percentage)}%
                        </div>
                        <div className="text-xs text-muted-foreground">ocupado</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - 4 colunas */}
                  <div className="flex-1 grid grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Inscritos</p>
                      <p className="text-3xl font-bold text-foreground">{enrolled}</p>
                      <p className="text-xs text-muted-foreground">de {cohort.capacity} vagas</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vagas Reservadas</p>
                      <p className="text-3xl font-bold text-secondary">{reserved}</p>
                      <p className="text-xs text-muted-foreground">aguardando pagamento</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vagas Pagas</p>
                      <p className="text-3xl font-bold text-primary">{paid}</p>
                      <p className="text-xs text-muted-foreground">matrículas pagas</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contratos Assinados</p>
                      <p className="text-3xl font-bold" style={{ color: 'hsl(var(--chart-5))' }}>{signed}</p>
                      <p className="text-xs text-muted-foreground">documentos firmados</p>
                    </div>
                  </div>

                  {/* Vagas Disponíveis ou Fila de Espera */}
                  <div className="space-y-1 pl-6 border-l border-border">
                    <p className="text-sm text-muted-foreground">
                      {isOverbooked ? 'Fila de Espera' : 'Vagas Disponíveis'}
                    </p>
                    <p className={`text-3xl font-bold ${isOverbooked ? 'text-destructive' : 'text-foreground'}`}>
                      {isOverbooked ? waitlist : (available > 0 ? available : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isOverbooked ? 'alunos aguardando' : 'vagas abertas'}
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
          </section>

          {/* Enrollments List */}
          <section className="px-8 pb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Alunos Inscritos ({enrollments.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Lista completa de todos os alunos matriculados nesta turma
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : enrollments.length === 0 ? (
              <Card className="p-8 border border-border bg-card">
                <p className="text-center text-muted-foreground">
                  Nenhum aluno inscrito nesta turma ainda.
                </p>
              </Card>
            ) : (
              <EnrollmentList 
                enrollments={enrollments} 
                cohortName={cohort.name}
                cohortId={cohortId}
              />
            )}
          </section>
        </main>

        {/* Modals */}
        {cohort && (
          <>
            <EnrollmentModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              cohortName={cohort.name}
              cohortId={cohortId || ""}
              onSubmit={handleEnrollmentSubmit}
            />
            <CsvImportModal
              open={csvModalOpen}
              onOpenChange={setCsvModalOpen}
              cohortName={cohort.name}
              cohortId={cohortId || ""}
            />
          </>
        )}
      </div>
    </SidebarProvider>
  );
};

export default CohortDetail;
