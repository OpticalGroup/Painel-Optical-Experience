import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { LayoutGrid, Settings as SettingsIcon, Plus, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CohortCardEnhanced } from "@/components/CohortCardEnhanced";
import { EnrollmentModal, EnrollmentData } from "@/components/EnrollmentModal";
import { useToast } from "@/hooks/use-toast";
import { useCohortsQuery } from "@/integrations/supabase/hooks/useCohorts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExportButton } from "@/components/ExportButton";
import { Button } from "@/components/ui/button";
import CohortsAdmin from "./CohortsAdmin";

export const Cohorts = () => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <>
            <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="flex items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Gerencie turmas e visualize ocupação
                            </p>
                        </div>
                    </div>
                    <UserMenu />
                </div>
            </header>

            <div className="px-8 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-secondary/50">
                        <TabsTrigger value="overview" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="admin" className="gap-2">
                            <SettingsIcon className="h-4 w-4" />
                            Administração
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <CohortsOverviewContent />
                    </TabsContent>

                    <TabsContent value="admin" className="space-y-6">
                        <CohortsAdminContent />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
};

// Extract content from CohortsOverview (without header)
const CohortsOverviewContent = () => {
    const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
    const [selectedCohortName, setSelectedCohortName] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { data: cohorts, isLoading } = useCohortsQuery();

    const handleEnrollmentSubmit = (data: EnrollmentData) => {
        // Modal handles the mutation directly
    };

    const handleViewDetails = (cohortId: string, cohortName: string) => {
        navigate(`/cohorts/${cohortId}`);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold">Todas as Turmas</h2>
                    <p className="text-sm text-muted-foreground">
                        Visão detalhada de todas as turmas e suas ocupações
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => window.open('/tutorials', '_blank')}
                        title="Ver Tutoriais"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </Button>
                    <ExportButton type="cohorts" label="Exportar Turmas" />
                    <Button
                        className="bg-primary hover:bg-primary/90 shadow-sm"
                        onClick={() => {
                            if (cohorts && cohorts.length > 0) {
                                setSelectedCohortId(cohorts[0].id);
                                setSelectedCohortName(cohorts[0].name);
                                setModalOpen(true);
                            }
                        }}
                        disabled={!cohorts || cohorts.length === 0}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Matrícula
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-80 w-full" />
                    ))}
                </div>
            ) : !cohorts || cohorts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        Nenhuma turma encontrada. Use a aba "Administração" para criar uma nova turma.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cohorts.map((cohort) => (
                        <CohortCardEnhanced
                            key={cohort.id}
                            name={cohort.name}
                            enrolled={cohort.stats?.enrolled_count || 0}
                            capacity={cohort.capacity}
                            paid={cohort.stats?.paid_count || 0}
                            reserved={cohort.stats?.reserved_count || 0}
                            signed={cohort.stats?.signed_count || 0}
                            startDate={format(new Date(cohort.start_date), "dd 'de' ", { locale: ptBR }) +
                                (cohort.end_date ? format(new Date(cohort.end_date), "dd/MM", { locale: ptBR }) : "")}
                            location={cohort.location}
                            onViewDetails={() => handleViewDetails(cohort.id, cohort.name)}
                        />
                    ))}
                </div>
            )}

            <EnrollmentModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                cohortName={selectedCohortName}
                cohortId={selectedCohortId || ""}
                onSubmit={handleEnrollmentSubmit}
            />
        </>
    );
};

// Render CohortsAdmin without outer wrapper
const CohortsAdminContent = () => {
    return (
        <div className="-mt-6">
            <CohortsAdmin />
        </div>
    );
};

export default Cohorts;
