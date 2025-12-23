import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const DebugRevenue = ({ enrollments, cohortId }: { enrollments: any[], cohortId: string }) => {
    const [rpcStats, setRpcStats] = useState<any>(null);

    useEffect(() => {
        supabase.rpc('get_cohort_stats', { p_cohort_id: cohortId })
            .then(res => setRpcStats(res.data?.[0]))
            .catch(console.error);
    }, [cohortId]);

    const jsSum = enrollments
        .filter(e => e.financial_status === 'paid')
        .reduce((acc, curr) => acc + (Number(curr.payment_amount) || 0), 0);

    const jsCount = enrollments.filter(e => e.financial_status === 'paid').length;

    return (
        <Card className="p-4 my-4 bg-yellow-50/10 border-yellow-500/50">
            <h3 className="font-bold text-yellow-500 mb-2">🕵️ Debug de Receita</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold">Lado Cliente (JS)</h4>
                    <p>Pagos: {jsCount}</p>
                    <p>Soma: R$ {jsSum.toLocaleString('pt-BR')}</p>

                    <div className="mt-2 max-h-40 overflow-auto text-xs font-mono bg-black/50 p-2 rounded">
                        {enrollments.filter(e => e.financial_status === 'paid').map(e => (
                            <div key={e.id} className="flex justify-between">
                                <span>{e.student_name.slice(0, 10)}...</span>
                                <span>{Number(e.payment_amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold">Lado Banco (RPC)</h4>
                    {rpcStats ? (
                        <div className="space-y-1">
                            <p>Pagos: {rpcStats.paid_count}</p>
                            <p>Receita: R$ {Number(rpcStats.total_revenue).toLocaleString('pt-BR')}</p>
                            <pre className="text-xs mt-2 bg-black/50 p-2 rounded">
                                {JSON.stringify(rpcStats, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <p>Carregando RPC...</p>
                    )}
                </div>
            </div>

            <p className="text-xs mt-4 text-muted-foreground">
                Se "Soma" e "Receita" forem diferentes, o banco está somando valores diferentes do que entrega para o front.
            </p>
        </Card>
    );
};
