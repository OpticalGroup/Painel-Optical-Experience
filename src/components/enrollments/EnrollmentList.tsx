import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentQuickActions } from "@/components/EnrollmentQuickActions";
import { ChevronDown, ChevronRight, Edit } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Enrollment } from "./types";

interface EnrollmentListProps {
    enrollments: Enrollment[];
    isLoading: boolean;
    onEdit: (enrollment: Enrollment) => void;
    onTransfer: (enrollment: Enrollment) => void;
}

export const EnrollmentList = ({ enrollments, isLoading, onEdit, onTransfer }: EnrollmentListProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <Card className="p-8 border border-border bg-card">
                <p className="text-center text-muted-foreground">
                    Nenhuma matrícula encontrada.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {enrollments.map((enrollment) => {
                const isExpanded = expandedRows.has(enrollment.id);

                return (
                    <Collapsible
                        key={enrollment.id}
                        open={isExpanded}
                        onOpenChange={() => toggleRow(enrollment.id)}
                    >
                        <Card className="border border-border bg-card hover:bg-muted/30 transition-colors">
                            <div className="p-4">
                                <div className="flex items-center gap-4">
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

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                        <div>
                                            <CollapsibleTrigger asChild>
                                                <button className="text-left hover:text-primary transition-colors">
                                                    <p className="font-semibold text-foreground">{enrollment.student_name}</p>
                                                    <p className="text-xs text-muted-foreground">{enrollment.email}</p>
                                                </button>
                                            </CollapsibleTrigger>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Turma</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {enrollment.cohorts?.name || 'N/A'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Vendedor</p>
                                            <p className="text-sm font-medium text-foreground">{enrollment.sales_rep}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Valor</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {enrollment.payment_amount
                                                    ? `R$ ${Number(enrollment.payment_amount).toLocaleString('pt-BR', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`
                                                    : '-'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="flex gap-2">
                                                <StatusBadge status={enrollment.financial_status} />
                                                {enrollment.contract_status === 'signed' && (
                                                    <StatusBadge status="signed" />
                                                )}
                                            </div>
                                            <EnrollmentQuickActions
                                                enrollmentId={enrollment.id}
                                                currentFinancialStatus={enrollment.financial_status}
                                                currentContractStatus={enrollment.contract_status}
                                                cohortId={enrollment.cohort_id}
                                                studentName={enrollment.student_name}
                                                clicksignDocumentId={enrollment.clicksign_document_id}
                                                onTransferClick={() => onTransfer(enrollment)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(enrollment)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <CardContent className="p-0">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">CPF</p>
                                                    <p className="text-sm text-muted-foreground">{enrollment.cpf}</p>
                                                </div>

                                                {enrollment.phone && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-foreground">Telefone</p>
                                                        <p className="text-sm text-muted-foreground">{enrollment.phone}</p>
                                                    </div>
                                                )}

                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">Origem</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{enrollment.source}</p>
                                                </div>

                                                {enrollment.purchase_date && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-foreground">Data de Compra</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(enrollment.purchase_date).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                )}

                                                {(enrollment.address || enrollment.city || enrollment.state || enrollment.zipcode) && (
                                                    <div className="space-y-1 md:col-span-2">
                                                        <p className="text-sm font-semibold text-foreground">Endereço</p>
                                                        <div className="text-sm text-muted-foreground space-y-0.5">
                                                            {enrollment.address && <p>{enrollment.address}</p>}
                                                            {(enrollment.city || enrollment.state || enrollment.zipcode) && (
                                                                <p>
                                                                    {[enrollment.city, enrollment.state, enrollment.zipcode]
                                                                        .filter(Boolean)
                                                                        .join(' - ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1 md:col-span-2">
                                                    <p className="text-sm font-semibold text-foreground">Condições de Pagamento</p>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {enrollment.payment_details}
                                                    </p>
                                                </div>

                                                {enrollment.payment_proof_url && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-foreground">Comprovante</p>
                                                        <a
                                                            href={enrollment.payment_proof_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            Ver comprovante
                                                        </a>
                                                    </div>
                                                )}

                                                {enrollment.observations && (
                                                    <div className="space-y-1 md:col-span-2">
                                                        <p className="text-sm font-semibold text-foreground">Observações</p>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {enrollment.observations}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Card>
                    </Collapsible>
                );
            })}
        </div>
    );
};
