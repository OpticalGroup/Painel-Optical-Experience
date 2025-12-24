import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LayoutGrid, Settings as SettingsIcon, Plus, HelpCircle, SlidersHorizontal } from "lucide-react";
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
            {/* Responsive Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-3">
                    {/* Left: Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <SidebarTrigger />
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                                Turmas
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden md:block">
                                Gerencie turmas e visualize ocupação
                            </p>
                        </div>
                    </div>

                    {/* Desktop Controls (lg+) */}
                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
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
                        <UserMenu />
                    </div>

                    {/* Mobile/Tablet Controls */}
                    <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                                <SheetHeader className="text-left mb-6">
                                    <SheetTitle>Opções</SheetTitle>
                                </SheetHeader>
                                <div className="space-y-3">
                                    <ExportButton type="cohorts" label="Exportar Turmas" className="w-full justify-start h-11" />
                                    <Button variant="ghost" onClick={() => window.open('/tutorials', '_blank')} className="w-full justify-start h-11 gap-2">
                                        <HelpCircle className="h-4 w-4" />
                                        Ver Tutoriais
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
                    <TabsList className="bg-secondary/50 w-full sm:w-auto">
                        <TabsTrigger value="overview" className="gap-2 flex-1 sm:flex-none">
                            <LayoutGrid className="h-4 w-4" />
                            <span className="hidden sm:inline">Visão Geral</span>
                            <span className="inline sm:hidden">Visão</span>
                        </TabsTrigger>
                        <TabsTrigger value="admin" className="gap-2 flex-1 sm:flex-none">
                            <SettingsIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Administração</span>
                            <span className="inline sm:hidden">Admin</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 lg:space-y-6">
                        <CohortsOverviewContent />
                    </TabsContent>

                    <TabsContent value="admin" className="space-y-4 lg:space-y-6">
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
    const [filter, setFilter] = useState("all");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { data: cohorts, isLoading } = useCohortsQuery();

    const handleEnrollmentSubmit = (data: EnrollmentData) => {
        // Modal handles the mutation directly
    };

    const handleViewDetails = (cohortId: string, cohortName: string) => {
        navigate(`/cohorts/${cohortId}`);
    };

    const filteredCohorts = cohorts?.filter(cohort => {
        if (filter === "all") return true;
        if (filter === "upcoming") {
            return cohort.status === "open" && new Date(cohort.start_date) > new Date();
        }
        if (filter === "completed") return cohort.status === "completed";
        if (filter === "cancelled") return cohort.status === "cancelled";
        return true;
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <h2 className="text-base lg:text-lg font-semibold">
                            {filter === "all" ? "Todas as Turmas" : 
                             filter === "upcoming" ? "Turmas Futuras" :
                             filter === "completed" ? "Turmas Concluídas" : "Turmas Canceladas"}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {filter === "all" ? "Visão detalhada de todas as turmas" :
                             filter === "upcoming" ? "Turmas com início previsto" :
                             filter === "completed" ? "Histórico de turmas finalizadas" : "Turmas que foram canceladas"}
                        </p>
                    </div>

                    <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
                        <TabsList className="bg-secondary/30 h-8 p-1">
                            <TabsTrigger value="all" className="text-[10px] sm:text-xs h-6 px-3">Todas</TabsTrigger>
                            <TabsTrigger value="upcoming" className="text-[10px] sm:text-xs h-6 px-3">Futuras</TabsTrigger>
                            <TabsTrigger value="completed" className="text-[10px] sm:text-xs h-6 px-3">Concluídas</TabsTrigger>
                            <TabsTrigger value="cancelled" className="text-[10px] sm:text-xs h-6 px-3">Canceladas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90 shadow-sm w-full sm:w-auto"
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

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-80 w-full" />
                    ))}
                </div>
            ) : !filteredCohorts || filteredCohorts.length === 0 ? (
                <div className="text-center py-12 bg-secondary/10 rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground">
                        Nenhuma turma encontrada nesta categoria.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {filteredCohorts.map((cohort) => (
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
        <div className="-mt-4 lg:-mt-6">
            <CohortsAdmin />
        </div>
    );
};

export default Cohorts;
