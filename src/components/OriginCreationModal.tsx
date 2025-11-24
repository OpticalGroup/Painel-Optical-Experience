import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";

interface OriginCreationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    missingOrigins: string[];
    onOriginsCreated: (originMapping: Record<string, any>) => void;
    onSkip: () => void;
}

interface OriginFormData {
    name: string;
    description: string;
}

export const OriginCreationModal = ({
    open,
    onOpenChange,
    missingOrigins,
    onOriginsCreated,
    onSkip,
}: OriginCreationModalProps) => {
    const [originForms, setOriginForms] = useState<Record<string, OriginFormData>>({});

    useEffect(() => {
        const forms: Record<string, OriginFormData> = {};
        missingOrigins.forEach(originName => {
            forms[originName] = {
                name: originName,
                description: '',
            };
        });
        setOriginForms(forms);
    }, [missingOrigins]);

    const updateOriginForm = (originName: string, field: keyof OriginFormData, value: string) => {
        setOriginForms(prev => ({
            ...prev,
            [originName]: {
                ...prev[originName],
                [field]: value,
            },
        }));
    };

    const validateForms = (): boolean => {
        return Object.values(originForms).every(
            form => form.name.trim().length > 0
        );
    };

    const handleCreateOrigins = () => {
        onOriginsCreated(originForms);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-primary text-2xl">
                        Criar Origens Ausentes
                    </DialogTitle>
                    <DialogDescription>
                        As seguintes origens não foram encontradas no sistema. Configure-as antes de continuar com a importação.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-primary/50 bg-primary/5 flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <strong>{missingOrigins.length} origem(ns) ausente(s).</strong> Preencha os dados ou pule para usar "Outro" ou manter o valor original (se possível).
                    </AlertDescription>
                </Alert>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {missingOrigins.map((originName, index) => (
                        <div key={originName} className="border border-border rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <Plus className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">
                                    Origem {index + 1}: {originName}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`name-${index}`}>
                                        Nome *
                                    </Label>
                                    <Input
                                        id={`name-${index}`}
                                        value={originForms[originName]?.name}
                                        onChange={(e) => updateOriginForm(originName, 'name', e.target.value)}
                                        className="focus-visible:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`description-${index}`}>
                                        Descrição
                                    </Label>
                                    <Textarea
                                        id={`description-${index}`}
                                        value={originForms[originName]?.description}
                                        onChange={(e) => updateOriginForm(originName, 'description', e.target.value)}
                                        className="focus-visible:ring-primary"
                                        rows={2}
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
                        Pular (Não criar origens)
                    </Button>
                    <Button
                        onClick={handleCreateOrigins}
                        disabled={!validateForms()}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        Criar {missingOrigins.length} Origem(ns) e Continuar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
