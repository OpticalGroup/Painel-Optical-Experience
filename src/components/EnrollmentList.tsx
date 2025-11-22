import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { ChevronDown, ChevronRight, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollmentModal } from "./EnrollmentModal";
import { EnrollmentQuickActions } from "./EnrollmentQuickActions";
import { TransferCohortModal } from "./TransferCohortModal";
import { Tables } from "@/integrations/supabase/types";

export interface Enrollment {
  id: string;
  name: string;
  email: string;
  cpf: string;
  salesRep: string;
  source: string;
  paymentStatus: "paid" | "pending";
  contractSigned: boolean;
  paymentAmount?: number;
  paymentDetails?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  purchaseDate?: string;
  leadDate?: string;
  observations?: string;
  paymentProofUrl?: string;
  productName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt?: string;
  updatedAt?: string;
  clicksignDocumentId?: string;
}

interface EnrollmentListProps {
  enrollments: Enrollment[];
  cohortName?: string;
  cohortId?: string;
}

export const EnrollmentList = ({ enrollments, cohortName, cohortId }: EnrollmentListProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingEnrollment, setEditingEnrollment] = useState<Tables<'enrollments'> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const hasAdditionalInfo = (enrollment: Enrollment) => {
    return !!(
      enrollment.phone ||
      enrollment.address ||
      enrollment.city ||
      enrollment.purchaseDate ||
      enrollment.leadDate ||
      enrollment.observations ||
      enrollment.paymentProofUrl ||
      enrollment.paymentDetails ||
      enrollment.productName ||
      enrollment.utmSource
    );
  };

  const handleEdit = (enrollment: Enrollment) => {
    const fullEnrollment: Tables<'enrollments'> = {
      id: enrollment.id,
      student_name: enrollment.name,
      email: enrollment.email,
      cpf: enrollment.cpf,
      phone: enrollment.phone || null,
      sales_rep: enrollment.salesRep,
      source: enrollment.source as any,
      payment_amount: enrollment.paymentAmount || null,
      payment_details: enrollment.paymentDetails || "",
      financial_status: enrollment.paymentStatus,
      contract_status: enrollment.contractSigned ? 'signed' : 'pending',
      cohort_id: cohortId || "",
      created_at: enrollment.createdAt || new Date().toISOString(),
      updated_at: enrollment.updatedAt || new Date().toISOString(),
      created_by: null,
      address: enrollment.address || null,
      city: enrollment.city || null,
      state: enrollment.state || null,
      zipcode: enrollment.zipcode || null,
      purchase_date: enrollment.purchaseDate || null,
      lead_date: enrollment.leadDate || null,
      observations: enrollment.observations || null,
      payment_proof_url: enrollment.paymentProofUrl || null,
      position_in_cohort: null,
      submitted_at: null,
      product_name: enrollment.productName || null,
      utm_source: enrollment.utmSource || null,
      utm_medium: enrollment.utmMedium || null,
      utm_campaign: enrollment.utmCampaign || null,
      utm_term: null,
      utm_content: null,
      // FASE 1: Novos campos de integração
      kommo_lead_id: null,
      clicksign_document_id: null,
      typeform_response_id: null,
      external_metadata: {},
    };
    setEditingEnrollment(fullEnrollment);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingEnrollment(null);
  };

  const handleTransferClick = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setTransferModalOpen(true);
  };

  return (
    <>
      <div className="rounded-md border border-secondary bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">Email</TableHead>
              <TableHead className="font-semibold text-foreground">CPF</TableHead>
              <TableHead className="font-semibold text-foreground">Vendedor</TableHead>
              <TableHead className="font-semibold text-foreground">Origem</TableHead>
              <TableHead className="font-semibold text-foreground">Valor</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const isExpanded = expandedRows.has(enrollment.id);
            const hasInfo = hasAdditionalInfo(enrollment);

            return (
              <Collapsible
                key={enrollment.id}
                open={isExpanded}
                onOpenChange={() => toggleRow(enrollment.id)}
                asChild
              >
                <>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      {hasInfo && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{enrollment.name}</TableCell>
                    <TableCell className="text-muted-foreground">{enrollment.email}</TableCell>
                    <TableCell className="text-muted-foreground">{enrollment.cpf}</TableCell>
                    <TableCell className="text-muted-foreground">{enrollment.salesRep}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{enrollment.source}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {enrollment.paymentAmount 
                        ? `R$ ${enrollment.paymentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <StatusBadge status={enrollment.paymentStatus} />
                        {enrollment.contractSigned && <StatusBadge status="signed" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cohortId && cohortName && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(enrollment)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <EnrollmentQuickActions
                            enrollmentId={enrollment.id}
                            currentFinancialStatus={enrollment.paymentStatus}
                            currentContractStatus={enrollment.contractSigned ? "signed" : "pending"}
                            cohortId={cohortId}
                            studentName={enrollment.name}
                            clicksignDocumentId={enrollment.clicksignDocumentId}
                            onTransferClick={() => handleTransferClick(enrollment)}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {hasInfo && (
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30 p-0">
                          <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Informações de Contato */}
                                <div className="space-y-4 md:col-span-1">
                                  <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">
                                    Contato
                                  </h4>
                                  {enrollment.phone && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Telefone</p>
                                      <p className="text-sm text-foreground">{enrollment.phone}</p>
                                    </div>
                                  )}
                                  {(enrollment.address || enrollment.city || enrollment.state || enrollment.zipcode) && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Endereço Completo</p>
                                      <div className="text-sm text-foreground space-y-0.5">
                                        {enrollment.address && <p>{enrollment.address}</p>}
                                        {(enrollment.city || enrollment.state) && (
                                          <p>{[enrollment.city, enrollment.state].filter(Boolean).join(' - ')}</p>
                                        )}
                                        {enrollment.zipcode && <p>CEP: {enrollment.zipcode}</p>}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Informações Comerciais */}
                                <div className="space-y-4 md:col-span-1">
                                  <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">
                                    Comercial
                                  </h4>
                                  {enrollment.productName && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Produto</p>
                                      <p className="text-sm text-foreground">{enrollment.productName}</p>
                                    </div>
                                  )}
                                  {enrollment.purchaseDate && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Data de Compra</p>
                                      <p className="text-sm text-foreground">
                                        {new Date(enrollment.purchaseDate).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  )}
                                  {enrollment.leadDate && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Data de Lead</p>
                                      <p className="text-sm text-foreground">
                                        {new Date(enrollment.leadDate).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  )}
                                  {enrollment.paymentDetails && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Condições de Pagamento</p>
                                      <p className="text-sm text-foreground whitespace-pre-wrap">
                                        {enrollment.paymentDetails}
                                      </p>
                                    </div>
                                  )}
                                  {enrollment.paymentProofUrl && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Comprovante</p>
                                      <a 
                                        href={enrollment.paymentProofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                      >
                                        📎 Ver comprovante
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Rastreamento e Observações */}
                                <div className="space-y-4 md:col-span-1">
                                  <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">
                                    Rastreamento
                                  </h4>
                                  {(enrollment.utmSource || enrollment.utmMedium || enrollment.utmCampaign) && (
                                    <div className="space-y-2">
                                      {enrollment.utmSource && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-muted-foreground">UTM Source</p>
                                          <p className="text-sm text-foreground">{enrollment.utmSource}</p>
                                        </div>
                                      )}
                                      {enrollment.utmMedium && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-muted-foreground">UTM Medium</p>
                                          <p className="text-sm text-foreground">{enrollment.utmMedium}</p>
                                        </div>
                                      )}
                                      {enrollment.utmCampaign && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-muted-foreground">UTM Campaign</p>
                                          <p className="text-sm text-foreground">{enrollment.utmCampaign}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {enrollment.createdAt && (
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground">Cadastrado em</p>
                                      <p className="text-sm text-foreground">
                                        {new Date(enrollment.createdAt).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Observações (Largura completa se existir) */}
                                {enrollment.observations && (
                                  <div className="space-y-2 md:col-span-3 pt-2 border-t border-border">
                                    <p className="text-xs font-semibold text-muted-foreground">Observações</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                                      {enrollment.observations}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  )}
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </div>

    {editingEnrollment && cohortName && cohortId && (
      <EnrollmentModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        cohortName={cohortName}
        cohortId={cohortId}
        onSubmit={() => {}}
        editingEnrollment={editingEnrollment}
      />
    )}
    
    {selectedEnrollment && cohortName && cohortId && (
      <TransferCohortModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        enrollmentId={selectedEnrollment.id}
        studentName={selectedEnrollment.name}
        currentCohortId={cohortId}
        currentCohortName={cohortName}
      />
    )}
  </>
  );
};
