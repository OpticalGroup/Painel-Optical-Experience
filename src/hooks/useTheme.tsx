import { useEffect } from "react";
import { useOrganizationSettings } from "@/integrations/supabase/hooks/useOrganizationSettings";

export const useTheme = () => {
  const { data: settings } = useOrganizationSettings();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Convert hex to HSL
    const hexToHSL = (hex: string): string => {
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

    // Apply theme colors
    const primary = hexToHSL(settings.primary_color);
    const secondary = hexToHSL(settings.secondary_color);
    const accent = hexToHSL(settings.accent_color);
    const background = hexToHSL(settings.background_color);
    const foreground = hexToHSL(settings.foreground_color);

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--background', background);
    root.style.setProperty('--foreground', foreground);

    // Update document title
    if (settings.organization_name) {
      document.title = `${settings.organization_name} - Gestão de Turmas`;
    }

    // Update favicon if logo exists
    if (settings.logo_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.logo_url;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [settings]);

  return settings;
};
