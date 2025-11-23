import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, MoreVertical, User, Mail, Phone, MapPin, Calendar, DollarSign, FileText, CreditCard, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EnrollmentQuickActions } from "../EnrollmentQuickActions";
import { Enrollment } from "./types";

interface EnrollmentListProps {
    enrollments: Enrollment[];
    isLoading: boolean;
    onEdit?: (enrollment: Enrollment) => void;
    onTransfer?: (enrollment: Enrollment) => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    cohortName?: string;
    cohortId?: string;
    totalCount?: number;
    onSelectAllGlobal?: () => void;
}

export const EnrollmentList = ({
    enrollments,
    isLoading,
    onEdit,
    onTransfer,
    selectedIds = [],
    onSelectionChange,
    cohortName,
    cohortId,
    totalCount = 0,
    onSelectAllGlobal
}: EnrollmentListProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (expandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            const allIds = enrollments.map(e => e.id);
            onSelectionChange(allIds);
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean, event: React.MouseEvent) => {
        if (!onSelectionChange) return;

        if (event.shiftKey && lastSelectedId) {
            const lastIndex = enrollments.findIndex(e => e.id === lastSelectedId);
            const currentIndex = enrollments.findIndex(e => e.id === id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = enrollments.slice(start, end + 1).map(e => e.id);

                const newSelectedIds = new Set(selectedIds);
                if (checked) {
                    rangeIds.forEach(rid => newSelectedIds.add(rid));
                } else {
                    rangeIds.forEach(rid => newSelectedIds.delete(rid));
                }
                onSelectionChange(Array.from(newSelectedIds));
            }
        } else {
            if (checked) {
                onSelectionChange([...selectedIds, id]);
                setLastSelectedId(id);
            } else {
                onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
            }
        }
    };

    const allPageSelected = enrollments.length > 0 && enrollments.every(e => selectedIds.includes(e.id));
    const isGlobalSelectionPossible = onSelectAllGlobal && totalCount > enrollments.length;
    const isAllGlobalSelected = selectedIds.length === totalCount && totalCount > 0;

    if (isLoading) {
        return <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
        </div>;
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
            {onSelectionChange && (
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-2 px-4 py-2">
                        <Checkbox
                            checked={allPageSelected}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                        <span className="text-sm text-muted-foreground">Selecionar todos desta página</span>
                    </div>

                    {allPageSelected && isGlobalSelectionPossible && !isAllGlobalSelected && (
                        <div className="bg-muted/50 p-2 text-center text-sm rounded-md animate-in fade-in slide-in-from-top-2">
                            Todos os {enrollments.length} alunos desta página estão selecionados.
                            <Button
                                variant="link"
                                className="h-auto p-0 ml-1 text-primary font-semibold"
                                onClick={onSelectAllGlobal}
                            >
                                Selecionar todos os {totalCount} alunos da turma
                            </Button>
                        </div>
                    )}

                    {isAllGlobalSelected && (
                        <div className="bg-muted/50 p-2 text-center text-sm rounded-md animate-in fade-in slide-in-from-top-2">
                            Todos os {totalCount} alunos estão selecionados.
                            <Button
                                variant="link"
                                className="h-auto p-0 ml-1 text-muted-foreground underline"
                                onClick={() => onSelectionChange([])}
                            >
                                Limpar seleção
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {enrollments.map((enrollment) => {
                const isExpanded = expandedRows.has(enrollment.id);
                const isSelected = selectedIds.includes(enrollment.id);

                return (
                    <div key={enrollment.id} className="flex items-start gap-2">
                        {onSelectionChange && (
                            <div className="pt-6 pl-2">
                                <Checkbox
                                    checked={isSelected}
                                    onClick={(e) => {
                                        const checked = !isSelected;
                                        handleSelectRow(enrollment.id, checked, e);
                                    }}
                                />
                            </div>
                        )}
                        <Collapsible
                            open={isExpanded}
                            onOpenChange={() => toggleRow(enrollment.id)}
                            className="flex-1"
                        >
                            <Card className={`border border-border bg-card hover:bg-muted/30 transition-colors ${isSelected ? 'border-primary/50 bg-primary/5' : ''}`}>
                                <div className="p-4">
                                    <div className="flex items-center gap-4">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </CollapsibleTrigger>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                            <div className="flex flex-col md:col-span-4">
                                                <span className={`font-medium text-foreground flex items-center gap-2 truncate ${(enrollment.external_metadata as any)?.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {enrollment.student_name}
                                                </span>
                                                <span className="text-sm text-muted-foreground truncate">{enrollment.email}</span>
                                            </div>

                                            <div className="flex flex-col md:col-span-3">
                                                <span className="text-sm text-muted-foreground">Turma</span>
                                                <span className="font-medium truncate">
                                                    {enrollment.cohorts?.name || cohortName || 'Sem turma'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col md:col-span-3">
                                                <span className="text-sm text-muted-foreground">Vendedor</span>
                                                <span className="font-medium truncate">{enrollment.sales_rep || '-'}</span>
                                            </div>

                                            <div className="flex flex-col md:col-span-2">
                                                <span className="text-sm text-muted-foreground">Valor</span>
                                                <span className="font-medium">
                                                    {enrollment.payment_amount
                                                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(enrollment.payment_amount)
                                                        : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 justify-end">
                                            {(enrollment.external_metadata as any)?.status === 'cancelled' ? (
                                                <Badge variant="destructive">Cancelado</Badge>
                                            ) : (
                                                <>
                                                    <Badge variant={enrollment.financial_status === 'paid' ? 'default' : 'secondary'}>
                                                        {enrollment.financial_status === 'paid' ? 'Pago' : 'Pendente'}
                                                    </Badge>

                                                    {enrollment.contract_status === 'signed' && (
                                                        <Badge variant="outline" className="border-green-500 text-green-500">
                                                            Contrato Assinado
                                                        </Badge>
                                                    )}
                                                </>
                                            )}

                                            <EnrollmentQuickActions
                                                enrollmentId={enrollment.id}
                                                currentFinancialStatus={enrollment.financial_status}
                                                currentContractStatus={enrollment.contract_status}
                                                cohortId={enrollment.cohort_id}
                                                studentName={enrollment.student_name}
                                                clicksignDocumentId={enrollment.clicksign_document_id}
                                                onTransferClick={() => onTransfer?.(enrollment)}
                                                isCancelled={(enrollment.external_metadata as any)?.status === 'cancelled'}
                                            />

                                            {onEdit && (
                                                <Button variant="ghost" size="icon" onClick={() => onEdit(enrollment)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="px-4 pb-4 pt-0 border-t border-border mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    <User className="h-4 w-4" /> Dados Pessoais
                                                </h4>
                                                <div className="text-sm space-y-1 text-muted-foreground">
                                                    <p>CPF: {enrollment.cpf}</p>
                                                    <p>Telefone: {enrollment.phone || '-'}</p>
                                                    <p>Endereço: {enrollment.address || '-'}</p>
                                                    <p>{enrollment.city}/{enrollment.state} - {enrollment.zipcode}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" /> Pagamento
                                                </h4>
                                                <div className="text-sm space-y-1 text-muted-foreground">
                                                    <p>Método: {enrollment.payment_details || '-'}</p>
                                                    <p>Data Compra: {enrollment.purchase_date ? format(new Date(enrollment.purchase_date), 'dd/MM/yyyy') : '-'}</p>
                                                    {enrollment.payment_proof_url && (
                                                        <a href={enrollment.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                            <FileText className="h-3 w-3" /> Ver Comprovante
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" /> Outros
                                                </h4>
                                                <div className="text-sm space-y-1 text-muted-foreground">
                                                    <p>Origem: {enrollment.source}</p>
                                                    <p>UTM: {enrollment.utm_source} / {enrollment.utm_medium}</p>
                                                    {enrollment.observations && (
                                                        <p className="italic mt-2">Obs: {enrollment.observations}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    </div>
                );
            })}
        </div>
    );
};
