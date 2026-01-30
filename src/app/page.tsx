
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { CommissionChart } from '@/components/dashboard/commission-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import {
  FileText,
  Clock,
  Hourglass,
  BadgePercent,
  Eye,
  EyeOff,
  X,
  Filter,
  XCircle,
  CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, isValid, startOfDay, subDays, endOfDay, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import type { Proposal, Customer, UserProfile } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProposalsStatusTable } from '@/components/dashboard/proposals-status-table';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { GoalCard } from '@/components/dashboard/goal-card';
import { ProductBreakdownChart } from '@/components/dashboard/product-breakdown-chart';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  const [appliedDateRange, setAppliedDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const [dialogData, setDialogData] = React.useState<{ title: string; proposals: Proposal[] } | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: proposals } = useCollection<Proposal>(proposalsQuery);
  
  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const userProfileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileDocRef);

  const handleDateInputChange = (value: string, type: 'start' | 'end') => {
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    formattedValue = formattedValue.replace(/(\d{2})(\d)/, '$1/$2');
    
    if (type === 'start') {
      setStartDateInput(formattedValue);
    } else {
      setEndDateInput(formattedValue);
    }
  };

  const applyRange = (range: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (range) {
        case 'today': from = startOfDay(now); break;
        case 'yesterday': from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); break;
        case 'week': from = startOfDay(subDays(now, 7)); break;
        case 'month': from = startOfMonth(now); break;
        case 'lastMonth': from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)); break;
        default: return;
    }

    setStartDateInput(from.toLocaleDateString('pt-BR'));
    setEndDateInput(to.toLocaleDateString('pt-BR'));
    setAppliedDateRange({ from, to });
  };

  const handleApplyFilter = () => {
    const startDate = parse(startDateInput, 'dd/MM/yyyy', new Date());
    const endDate = parse(endDateInput, 'dd/MM/yyyy', new Date());
    if (isValid(startDate) && isValid(endDate)) {
        setAppliedDateRange({ from: startDate, to: endDate });
    }
  };

  const clearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedDateRange(undefined);
  }

  const filteredProposals = React.useMemo(() => {
    if (!proposals || !isClient) return [];
    const today = new Date();
    const fromDate = appliedDateRange?.from || startOfMonth(today);
    const toDate = appliedDateRange?.to || endOfMonth(today);
    const effectiveToDate = new Date(toDate);
    effectiveToDate.setHours(23, 59, 59, 999);
  
    return proposals.filter(p => {
      if (!p.dateDigitized) return false;
      const proposalDate = new Date(p.dateDigitized);
      return proposalDate >= fromDate && proposalDate <= effectiveToDate;
    });
  }, [proposals, appliedDateRange, isClient]);

  const stats = React.useMemo(() => {
    const getSum = (list: Proposal[]) => list.reduce((sum, p) => sum + (p.commissionBase === 'net' ? (p.netAmount || 0) : (p.grossAmount || 0)), 0);
    
    const totalDigitado = getSum(filteredProposals);
    const pendente = getSum(filteredProposals.filter(p => p.status === 'Pendente'));
    const emAndamento = getSum(filteredProposals.filter(p => p.status === 'Em Andamento'));
    const aguardandoSaldo = getSum(filteredProposals.filter(p => p.status === 'Aguardando Saldo'));
    const saldoPago = getSum(filteredProposals.filter(p => p.status === 'Saldo Pago'));
    const reprovado = getSum(filteredProposals.filter(p => p.status === 'Reprovado'));
    const pago = getSum(filteredProposals.filter(p => p.status === 'Pago'));

    const getPerc = (val: number) => totalDigitado > 0 ? (val / totalDigitado) * 100 : 0;

    return {
        totalDigitado,
        pendente,
        emAndamento,
        aguardandoSaldo,
        saldoPago,
        reprovado,
        pago,
        totalPagoMeta: pago + saldoPago,
        percPendente: getPerc(pendente),
        percEmAndamento: getPerc(emAndamento),
        percAguardandoSaldo: getPerc(aguardandoSaldo),
        percSaldoPago: getPerc(saldoPago),
        percReprovado: getPerc(reprovado)
    };
  }, [filteredProposals]);

  const currentMonthName = format(appliedDateRange?.from || new Date(), 'MMMM', { locale: ptBR });

  return (
    <AppLayout>
       <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Exibindo dados para o mês de {currentMonthName}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-lg border shadow-sm">
                <Select onValueChange={(val) => applyRange(val as any)}>
                    <SelectTrigger className='w-[140px] h-9 border-none shadow-none focus:ring-0'>
                        <CalendarIcon className='mr-2 h-4 w-4 text-primary' />
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="yesterday">Ontem</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Mês Atual</SelectItem>
                        <SelectItem value="lastMonth">Mês Passado</SelectItem>
                    </SelectContent>
                </Select>
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <div className="flex items-center gap-1">
                    <span className='text-xs text-muted-foreground px-1'>De</span>
                    <Input 
                        placeholder="--" 
                        value={startDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'start')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center"
                    />
                    <span className='text-muted-foreground'>-</span>
                    <span className='text-xs text-muted-foreground px-1'>Até</span>
                    <Input 
                        placeholder="--" 
                        value={endDateInput}
                        onChange={(e) => handleDateInputChange(e.target.value, 'end')}
                        maxLength={10}
                        className="h-9 w-24 border-none shadow-none text-center"
                    />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className='h-8 bg-[#0091FF] hover:bg-[#0071E3]'><Filter className="h-3 w-3 mr-1" /> Filtrar</Button>
                {(startDateInput || appliedDateRange) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDates}><X className="h-4 w-4" /></Button>
                )}
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setIsPrivacyMode(!isPrivacyMode)}>
                    {isPrivacyMode ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
            </div>
        </div>

        <GoalCard 
            currentProduction={stats.totalPagoMeta} 
            totalDigitized={stats.totalDigitado}
            isPrivacyMode={isPrivacyMode}
            className="w-full"
        />

        <div className="grid gap-4 md:grid-cols-3">
            <StatsCard 
                title="Total Digitado" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.totalDigitado)} 
                icon={FileText} 
                percentage={100}
            />
            <StatsCard 
                title="Pendente" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.pendente)} 
                icon={BadgePercent} 
                percentage={stats.percPendente}
                valueClassName="text-purple-500"
                className="border-purple-100"
            />
            <StatsCard 
                title="Em Andamento" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.emAndamento)} 
                icon={Hourglass} 
                percentage={stats.percEmAndamento}
                valueClassName="text-yellow-500"
                className="border-yellow-100"
            />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <StatsCard 
                title="Aguardando Saldo" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.aguardandoSaldo)} 
                icon={Clock} 
                percentage={stats.percAguardandoSaldo}
                valueClassName="text-blue-500"
                className="border-blue-100"
            />
            <StatsCard 
                title="Saldo Pago" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.saldoPago)} 
                icon={CheckCircle2} 
                percentage={stats.percSaldoPago}
                valueClassName="text-orange-500"
                className="border-orange-100"
            />
            <StatsCard 
                title="Reprovado" 
                value={isPrivacyMode ? '•••••' : formatCurrency(stats.reprovado)} 
                icon={XCircle} 
                percentage={stats.percReprovado}
                valueClassName="text-red-500"
                className="border-red-100"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <CommissionChart proposals={proposals || []} />
            </div>
            <div className="lg:col-span-1">
                <ProductBreakdownChart proposals={filteredProposals} />
            </div>
        </div>
      </div>

      <Dialog open={!!dialogData} onOpenChange={(isOpen) => !isOpen && setDialogData(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>{dialogData?.title}</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    <ProposalsStatusTable proposals={dialogData?.proposals || []} customers={customers || []} />
                </div>
            </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
