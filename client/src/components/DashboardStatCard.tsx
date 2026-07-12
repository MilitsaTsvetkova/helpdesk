import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  label: string;
  value: string;
  isPending: boolean;
};

export function DashboardStatCard({ label, value, isPending }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-semibold text-slate-800">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
