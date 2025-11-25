import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCoursesQuery, useDeleteCourse } from "@/integrations/supabase/hooks/useCourses";
import { ProductDialog } from "./ProductDialog";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

export const ProductsTab = () => {
    const { data: courses, isLoading } = useCoursesQuery();
    const deleteCourse = useDeleteCourse();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Course | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Course | null>(null);

    const handleEdit = (product: Course) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;

        try {
            await deleteCourse.mutateAsync(deletingProduct.id);
            toast({ title: "Produto excluído com sucesso" });
        } catch (error: any) {
            toast({
                title: "Erro ao excluir produto",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setDeletingProduct(null);
        }
    };

    if (isLoading) {
        return <div>Carregando produtos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium">Produtos</h2>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os produtos (cursos) disponíveis no sistema
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                </Button>
            </div>

            <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
                    <div className="col-span-4">Nome</div>
                    <div className="col-span-6">Descrição</div>
                    <div className="col-span-2 text-right">Ações</div>
                </div>

                <div className="divide-y">
                    {courses?.map((course) => (
                        <div key={course.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                            <div className="col-span-4 font-medium">{course.name}</div>
                            <div className="col-span-6 text-muted-foreground truncate">
                                {course.description || "-"}
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeletingProduct(course)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(!courses || courses.length === 0) && (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum produto cadastrado.
                        </div>
                    )}
                </div>
            </div>

            <ProductDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                product={editingProduct}
            />

            <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
                            "{deletingProduct?.name}" e pode afetar turmas vinculadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
