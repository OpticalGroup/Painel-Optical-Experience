import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUtmSettings, UtmConfig } from "@/integrations/supabase/hooks/useUtmSettings";
import { Loader2, Link } from "lucide-react";

export const UTMSettings = () => {
    const { config, isLoading, updateSettings } = useUtmSettings();

    const handleToggle = (key: keyof UtmConfig) => {
        const newConfig = { ...config, [key]: !config[key] };
        updateSettings.mutate(newConfig);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Parâmetros UTM
                </CardTitle>
                <CardDescription>
                    Configure quais parâmetros de rastreamento (UTM) devem ser exibidos no formulário de matrícula.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_source">UTM Source (Origem)</Label>
                        <p className="text-sm text-muted-foreground">
                            Identifica a origem do tráfego (ex: google, newsletter).
                        </p>
                    </div>
                    <Switch
                        id="utm_source"
                        checked={config.utm_source}
                        onCheckedChange={() => handleToggle("utm_source")}
                        disabled={updateSettings.isPending}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_medium">UTM Medium (Meio)</Label>
                        <p className="text-sm text-muted-foreground">
                            Identifica o meio de marketing (ex: cpc, banner, email).
                        </p>
                    </div>
                    <Switch
                        id="utm_medium"
                        checked={config.utm_medium}
                        onCheckedChange={() => handleToggle("utm_medium")}
                        disabled={updateSettings.isPending}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_campaign">UTM Campaign (Campanha)</Label>
                        <p className="text-sm text-muted-foreground">
                            Identifica a campanha específica (ex: lancamento_verao).
                        </p>
                    </div>
                    <Switch
                        id="utm_campaign"
                        checked={config.utm_campaign}
                        onCheckedChange={() => handleToggle("utm_campaign")}
                        disabled={updateSettings.isPending}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_content">UTM Content (Conteúdo)</Label>
                        <p className="text-sm text-muted-foreground">
                            Usado para diferenciar anúncios ou links (ex: logolink, textlink).
                        </p>
                    </div>
                    <Switch
                        id="utm_content"
                        checked={config.utm_content}
                        onCheckedChange={() => handleToggle("utm_content")}
                        disabled={updateSettings.isPending}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_term">UTM Term (Termo)</Label>
                        <p className="text-sm text-muted-foreground">
                            Identifica as palavras-chave pagas.
                        </p>
                    </div>
                    <Switch
                        id="utm_term"
                        checked={config.utm_term}
                        onCheckedChange={() => handleToggle("utm_term")}
                        disabled={updateSettings.isPending}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="utm_page">UTM Page (Página)</Label>
                        <p className="text-sm text-muted-foreground">
                            Identifica a página de conversão.
                        </p>
                    </div>
                    <Switch
                        id="utm_page"
                        checked={config.utm_page}
                        onCheckedChange={() => handleToggle("utm_page")}
                        disabled={updateSettings.isPending}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
