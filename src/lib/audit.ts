import { supabase } from "@/integrations/supabase/client";

export interface AuditLogParams {
    action: string;
    entityId: string;
    entityType: string;
    beforeData?: any;
    afterData?: any;
}

export const logAuditAction = async ({
    action,
    entityId,
    entityType,
    beforeData,
    afterData,
}: AuditLogParams) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("audit_logs").insert({
            action,
            entity_id: entityId,
            entity_type: entityType,
            before_data: beforeData,
            after_data: afterData,
            user_id: user?.id,
            user_email: user?.email,
        });
    } catch (error) {
        console.error("Failed to log audit action:", error);
        // We don't throw here to avoid blocking the main action
    }
};
