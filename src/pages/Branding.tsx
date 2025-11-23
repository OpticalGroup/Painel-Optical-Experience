import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Palette, Upload, Globe, Save } from "lucide-react";
import { useOrganizationSettings, useUpdateOrganizationSettings, useUploadLogo } from "@/integrations/supabase/hooks/useOrganizationSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Branding = () => {
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const uploadLogo = useUploadLogo();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    organization_name: "",
    primary_color: "#6E66D9",
    secondary_color: "#D6CDC8",
    accent_color: "#D6CDC8",
    background_color: "#EDEDED",
    foreground_color: "#242424",
    custom_domain: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        accent_color: settings.accent_color,
        background_color: settings.background_color,
        foreground_color: settings.foreground_color,
        custom_domain: settings.custom_domain || "",
      });
    }
  }, [settings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB.",
        variant: "destructive",
      });
      return;
    }

    uploadLogo.mutate(file);
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const handleApplyTheme = () => {
    // Apply colors to CSS variables
    const root = document.documentElement;

    // Convert hex to HSL for primary
    const primary = hexToHSL(formData.primary_color);
    const secondary = hexToHSL(formData.secondary_color);
    const accent = hexToHSL(formData.accent_color);
    const background = hexToHSL(formData.background_color);
    const foreground = hexToHSL(formData.foreground_color);

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--background', background);
    root.style.setProperty('--foreground', foreground);

    toast({
      title: "Tema aplicado",
      description: "Visualize as mudanças. Salve para manter permanentemente.",
    });
  };

  const hexToHSL = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Marca e Identidade Visual
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Personalize a aparência do sistema com sua marca
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            {/* Logo Upload */}
            <Card className="p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                    {settings?.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Logo da Organização</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Faça upload do logo da sua marca. Tamanho máximo: 2MB. Formatos: PNG, JPG, SVG.
                    </p>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadLogo.isPending}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Organization Name */}
            <Card className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Nome da Organização
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Nome</Label>
                  <Input
                    id="org-name"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-domain">Domínio Customizado (opcional)</Label>
                  <Input
                    id="custom-domain"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                    placeholder="seudominio.com.br"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Configure o domínio nas{" "}
                    <a
                      href="https://docs.lovable.dev/features/custom-domain"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      configurações do projeto
                    </a>
                  </p>
                </div>
              </div>
            </Card>

            {/* Color Customization */}
            <Card className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Paleta de Cores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Botões principais, links e destaques
                  </p>
                </div>

                <div>
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Badges premium e elementos secundários
                  </p>
                </div>

                <div>
                  <Label htmlFor="background-color">Cor de Fundo</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fundo principal da aplicação
                  </p>
                </div>

                <div>
                  <Label htmlFor="foreground-color">Cor do Texto</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      id="foreground-color"
                      type="color"
                      value={formData.foreground_color}
                      onChange={(e) => setFormData({ ...formData, foreground_color: e.target.value })}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.foreground_color}
                      onChange={(e) => setFormData({ ...formData, foreground_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cor principal dos textos
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  onClick={handleApplyTheme}
                  variant="outline"
                  className="flex-1"
                >
                  Pré-visualizar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-muted/30">
              <h4 className="font-semibold text-foreground mb-3">Domínio Customizado</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Para configurar um domínio personalizado para sua organização:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse as configurações do projeto no Lovable</li>
                <li>Vá em "Domains" e clique em "Connect Domain"</li>
                <li>Siga as instruções para configurar os registros DNS</li>
                <li>Aguarde a propagação (até 72h)</li>
                <li>O SSL será provisionado automaticamente</li>
              </ol>
              <a
                href="https://docs.lovable.dev/features/custom-domain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm mt-3 inline-block"
              >
                Ver documentação completa →
              </a>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default Branding;
