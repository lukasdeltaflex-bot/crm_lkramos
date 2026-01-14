import { getProposalsWithCustomerData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function RecentProposals() {
  const recentProposals = getProposalsWithCustomerData().slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Propostas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell>
                  <div className="font-medium">{proposal.customer.name}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {proposal.customer.email}
                  </div>
                </TableCell>
                <TableCell>{proposal.product}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn({
                      'border-green-500 text-green-500':
                        proposal.status === 'Pago' ||
                        proposal.status === 'Aprovado',
                      'border-yellow-500 text-yellow-500':
                        proposal.status === 'Em Andamento' ||
                        proposal.status === 'Aguardando Saldo',
                      'border-red-500 text-red-500':
                        proposal.status === 'Rejeitado',
                    })}
                  >
                    {proposal.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(proposal.grossAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
