import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";

interface SellerCreationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    missingSellers: string[];
    onSellersCreated: (sellerMapping: Record<string, any>) => void;
    onSkip: () => void;
}

interface SellerFormData {
    name: string;
    email: string;
    phone: string;
}

export const SellerCreationModal = ({
    open,
    onOpenChange,
    missingSellers,
    onSellersCreated,
    onSkip,
}: SellerCreationModalProps) => {
    const [sellerForms, setSellerForms] = useState<Record<string, SellerFormData>>({});

    useEffect(() => {
        const forms: Record<string, SellerFormData> = {};
        missingSellers.forEach(sellerName => {
            forms[sellerName] = {
                name: sellerName,
                email: '',
                phone: '',
            };
        });
        setSellerForms(forms);
    }, [missingSellers]);

    const updateSellerForm = (sellerName: string, field: keyof SellerFormData, value: string) => {
        setSellerForms(prev => ({
            ...prev,
            [sellerName]: {
                ...prev[sellerName],
                [field]: value,
            },
        }));
    };

    const validateForms = (): boolean => {
        return Object.values(sellerForms).every(
            form => form.name.trim().length > 0
        );
    };

    const handleCreateSellers = () => {
        onSellersCreated(sellerForms);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-primary text-2xl">
                        Criar Vendedores Ausentes
                    </DialogTitle>
                    <DialogDescription>
                        Os seguintes vendedores não foram encontrados no sistema. Configure-os antes de continuar com a importação.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-primary/50 bg-primary/5 flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <strong>{missingSellers.length} vendedor(es) ausente(s).</strong> Preencha os dados ou pule para manter o nome original apenas como texto.
                    </AlertDescription>
                </Alert>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {missingSellers.map((sellerName, index) => (
                        <div key={sellerName} className="border border-border rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <Plus className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">
                                    Vendedor {index + 1}: {sellerName}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`name-${index}`}>
                                        Nome *
                                    </Label>
                                    <Input
                                        id={`name-${index}`}
                                        value={sellerForms[sellerName]?.name}
                                        onChange={(e) => updateSellerForm(sellerName, 'name', e.target.value)}
                                        className="focus-visible:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`email-${index}`}>
                                        Email
                                    </Label>
                                    <Input
                                        id={`email-${index}`}
                                        type="email"
                                        value={sellerForms[sellerName]?.email}
                                        onChange={(e) => updateSellerForm(sellerName, 'email', e.target.value)}
                                        className="focus-visible:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`phone-${index}`}>
                                        Telefone
                                    </Label>
                                    <Input
                                        id={`phone-${index}`}
                                        value={sellerForms[sellerName]?.phone}
                                        onChange={(e) => updateSellerForm(sellerName, 'phone', e.target.value)}
                                        className="focus-visible:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={onSkip}
                        className="flex-1"
                    >
                        Pular (Não criar vendedores)
                    </Button>
                    <Button
                        onClick={handleCreateSellers}
                        disabled={!validateForms()}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        Criar {missingSellers.length} Vendedor(es) e Continuar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
