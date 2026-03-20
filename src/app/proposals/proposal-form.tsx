'use client';

/**
 * @fileOverview Formulário mestre LK RAMOS para criação e edição de propostas.
 * Otimizado para alta produtividade e regras de negócio específicas (Portabilidade).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
    Check, 
    Loader2, 
    History, 
    Calendar as CalendarIcon,
    AlertTriangle,
    MessageSquareText,
    Clock,
    FolderLock,
    Info,
    Percent,
    Timer as TimerIcon,
    CircleDollarSign,
    Send,
    FileCheck,
    PenTool,
    ShieldCheck,
    Zap,
    Save,
    Landmark,
    Users,
    CreditCard,
    TrendingUp,
    Briefcase,
    Building2,
    UserCircle2,
    Search,
    ListChecks,
    Sparkles
} from 'lucide-react';
import { format, parse, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency, cleanBankName, cleanFirestoreData, formatCurrencyInput } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, ProposalStatus, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useMemo } from 'react';
import { ProposalAttachmentUploader } from '@/components/proposals/proposal-attachment-uploader';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import { useTheme } from '@/components/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { summarizeNotes } from '@/ai/flows/summarize-notes-flow';

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
});

const optionalDateString = z.string().optional().refine(val => !val || !isNaN(parse(val, 'dd/MM/yyyy', new Date()).getTime()), {
    message: "Data inválida. Use o formato dd/mm/aaaa.",
});

const proposalSchema = z.object({
  proposalNumber: z.string().min(1, "O N° da proposta é obrigatório."),
  originalContractNumber: z.string().optional(),
  customerId: z.string({ required_error: 'Selecione um cliente.' }),
  product: z.string().min(1, 'O produto é obrigatório.'),
  status: z.string({ required_error: 'Selecione um status.' }),
  rejectionReason: z.string().optional(),
  
  commissionStatus: z.string().optional(),
  amountPaid: z.coerce.number().optional(),
  commissionPaymentDate: z.string().optional(),
  
  selectedBenefitNumber: z.string().optional(),

  table: z.string().min(1, 'A tabela é obrigatória.'),
  term: z.coerce.number().optional(),
  originalTerm: z.coerce.number().optional(),
  remainingInstallments: z.coerce.number().optional(),
  interestRate: z.coerce.number().optional(),

  installmentAmount: z.coerce.number().min(0, 'O valor da parcela é obrigatório.'),
  netAmount: z.coerce.number().optional(),
  grossAmount: z.coerce.number().min(0, 'O valor é obrigatório.'),
  
  commissionBase: z.enum(['gross', 'net'], { required_error: 'Selecione a base da comissão.' }),
  commissionPercentage: z.coerce.number().min(0, 'A porcentagem da comissão é obrigatória.'),
  commissionValue: z.coerce.number().min(0, 'O valor da comissão é obrigatória.'),

  promoter: z.string().min(1, 'A promotora é obrigatória.'),
  bank: z.string().min(1, 'O banco é obrigatório.'),
  bankOrigin: z.string().optional(),
  approvingBody: z.string().min(1, 'O órgão aprovador é obrigatório.'),
  operator: z.string().min(1, "O nome do operador é obrigatório."),

  dateDigitized: z.string().refine((date) => {
    try {
      if (!date) return false;
      const parsedDate = date.includes('-') 
        ? parse(date, 'yyyy-MM-dd', new Date())
        : parse(date, 'dd/MM/yyyy', new Date());
      return isValid(parsedDate);
    } catch { return false; }
  }, { message: 'Data inválida. Use o formato dd/mm/aaaa.' }),
  dateApproved: optionalDateString,
  datePaidToClient: optionalDateString,
  debtBalanceArrivalDate: optionalDateString,
  
  attachments: z.array(attachmentSchema).optional(),
  observations: z.string().optional(),
  checklist: z.record(z.boolean()).optional(),
}).superRefine((data, ctx) => {
  if (data.product === 'Portabilidade' && (!data.originalContractNumber || data.originalContractNumber.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O N° do contrato portado é obrigatório para Portabilidade.",
      path: ["originalContractNumber"],
    });
  }
  if (data.status === 'Reprovado' && (!data.rejectionReason || data.rejectionReason.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione o motivo da reprova.",
      path: ["rejectionReason"],
    });
  }
});

type ProposalFormValues = z.infer<typeof proposalSchema>;
type ProposalFormData = Partial<Omit<Proposal, 'id' | 'ownerId'>>;

interface ProposalFormProps {
  proposal?: Proposal;
  allProposals: Proposal[];
  customers: Customer[];
  userSettings: UserSettings | null;
  isReadOnly?: boolean;
  onSubmit: (data: any) => void;
  onDuplicate: (proposal: Proposal) => void;
  defaultValues?: ProposalFormData;
  sheetMode: 'new' | 'edit' | 'view';
  onOpenCustomerSearch: () => void;
  selectedCustomerFromSearch: Customer | null;
  onCustomerSearchSelectionHandled: () => void;
  isSaving?: boolean;
}

const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, '$1/$2');
    return v;
};

export function ProposalForm({ 
    proposal, 
    allProposals,
    customers, 
    userSettings, 
    isReadOnly, 
    onSubmit, 
    onDuplicate, 
    defaultValues, 
    sheetMode,
    onOpenCustomerSearch,
    selectedCustomerFromSearch,
    onCustomerSearchSelectionHandled,
    isSaving = false
}: ProposalFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { statusColors } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState('');
  const [stagedHistory, setStagedHistory] = useState<ProposalHistoryEntry[]>([]);
  const [isSummarizingObs, setIsSummarizingObs] = useState(false);

  const productTypes = userSettings?.productTypes || configData.productTypes;
  const proposalStatuses = userSettings?.proposalStatuses || configData.proposalStatuses;
  const rejectionReasons = userSettings?.rejectionReasons || configData.defaultRejectionReasons;
  const historyTopics = userSettings?.historyTopics || configData.defaultHistoryTopics;
  const approvingBodies = userSettings?.approvingBodies || configData.approvingBodies;
  const banks = userSettings?.banks || configData.banks;
  const showLogos = userSettings?.showBankLogos ?? true;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDateForForm = (dateString?: string) => {
    if (!dateString) return '';
    try {
        if (dateString.includes('T')) {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'dd/MM/yyyy') : '';
        }
        const parts = dateString.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return '';
    } catch { return ''; }
  }

  const initialValues = useMemo(() => {
    const base = proposal || {};
    const overrides = defaultValues || {};
    const source = { ...base, ...overrides };

    return {
      proposalNumber: source?.proposalNumber || '',
      originalContractNumber: source?.originalContractNumber || '',
      customerId: source?.customerId || '',
      product: source?.product || 'Margem',
      status: source?.status || 'Em Andamento',
      rejectionReason: source?.rejectionReason || '',
      commissionStatus: source?.commissionStatus || 'Pendente',
      amountPaid: source?.amountPaid || 0,
      commissionPaymentDate: source?.commissionPaymentDate ? formatDateForForm(source.commissionPaymentDate) : '',
      selectedBenefitNumber: source?.selectedBenefitNumber || '',
      table: source?.table || '',
      term: source?.term ?? 84,
      originalTerm: source?.originalTerm ?? 84,
      remainingInstallments: source?.remainingInstallments ?? 0,
      interestRate: source?.interestRate ?? 0,
      grossAmount: source?.grossAmount ?? 0,
      netAmount: source?.netAmount ?? 0,
      installmentAmount: source?.installmentAmount ?? 0,
      commissionBase: (source?.commissionBase || 'gross') as 'gross' | 'net',
      commissionPercentage: source?.commissionPercentage ?? 0,
      commissionValue: source?.commissionValue ?? 0,
      promoter: source?.promoter || '',
      bank: source?.bank || '',
      bankOrigin: source?.bankOrigin || '',
      approvingBody: source?.approvingBody || 'INSS',
      operator: source?.operator || '',
      dateDigitized: source?.dateDigitized ? formatDateForForm(source.dateDigitized) : (isClient ? format(new Date(), 'dd/MM/yyyy') : ''),
      dateApproved: formatDateForForm(source?.dateApproved),
      datePaidToClient: formatDateForForm(source?.datePaidToClient),
      debtBalanceArrivalDate: formatDateForForm(source?.debtBalanceArrivalDate),
      attachments: source?.attachments || [],
      observations: source?.observations || '',
      checklist: source?.checklist || {
        formalization: false,
        documentation: false,
        signature: false,
        approval: false
      },
    };
  }, [proposal, defaultValues, isClient]);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const { watch, setValue } = form;
  const productValue = watch('product');
  const selectedCustomerId = watch('customerId');
  const currentStatusValue = watch('status');
  const commissionBase = watch('commissionBase');
  const commissionPercentage = watch('commissionPercentage');
  const grossAmount = watch('grossAmount');
  const netAmount = watch('netAmount');
  const originalContractNumber = watch('originalContractNumber');
  const showLogosSettings = userSettings?.showBankLogos ?? true;
  const watchObservations = watch('observations');

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerFromSearch) {
        setValue('customerId', selectedCustomerFromSearch.id, { shouldValidate: true });
        onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, setValue, onCustomerSearchSelectionHandled]);

  useEffect(() => {
    if (selectedCustomer && !form.getValues('selectedBenefitNumber')) {
        const benefits = selectedCustomer.benefits || [];
        if (benefits.length === 1) {
            setValue('selectedBenefitNumber', benefits[0].number);
        }
    }
  }, [selectedCustomer, setValue, form]);

  const rejectedPrevious = useMemo(() => {
    if (productValue !== 'Portabilidade' || !originalContractNumber || originalContractNumber.length < 5) return null;
    return allProposals.find(p => 
        p.originalContractNumber === originalContractNumber && 
        p.status === 'Reprovado' && 
        p.id !== proposal?.id
    );
  }, [originalContractNumber, productValue, allProposals, proposal?.id]);

  useEffect(() => {
    if (isReadOnly) return;
    const baseVal = commissionBase === 'gross' ? (grossAmount || 0) : (netAmount || 0);
    const calculated = parseFloat((baseVal * ((commissionPercentage || 0) / 100)).toFixed(2));
    if (watch('commissionValue') !== calculated) {
        setValue('commissionValue', calculated);
    }
  }, [commissionBase, commissionPercentage, grossAmount, netAmount, setValue, isReadOnly, watch]);

  const handleSummarizeObs = async () => {
    if (!watchObservations || watchObservations.trim().length < 10) {
        toast({ variant: 'destructive', title: 'Texto curto', description: 'Escreva um parecer para a IA resumir.' });
        return;
    }
    setIsSummarizingObs(true);
    try {
        const summary = await summarizeNotes(watchObservations);
        setValue('observations', summary, { shouldValidate: true });
        toast({ title: 'Observações resumidas com IA!' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Falha na IA' });
    } finally {
        setIsSummarizingObs(false);
    }
  };

  const handleAddHistory = (customMessage: string) => {
    if (!customMessage || !user) return;
    const now = new Date().toISOString();
    const entry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: customMessage,
        userName: user.displayName || user.email || 'Agente'
    };
    setStagedHistory(prev => [entry, ...prev]);
    setNewHistoryEntry('');
  };

  const displayHistory = useMemo(() => {
    const existing = Array.isArray(proposal?.history) ? proposal!.history : [];
    return [...existing, ...stagedHistory].sort((a,b) => b.date.localeCompare(a.date));
  }, [proposal?.history, stagedHistory]);

  function handleFormSubmit(data: ProposalFormValues) {
    const convertToIso = (dateStr?: string) => {
        if (!dateStr || dateStr.trim() === '') return null;
        try {
            const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
            return isValid(parsed) ? parsed.toISOString() : null;
        } catch { return null; }
    }

    const finalData: any = {
        ...data,
        dateDigitized: convertToIso(data.dateDigitized),
        dateApproved: convertToIso(data.dateApproved),
        datePaidToClient: convertToIso(data.datePaidToClient),
        debtBalanceArrivalDate: convertToIso(data.debtBalanceArrivalDate),
        commissionPaymentDate: convertToIso(data.commissionPaymentDate),
        // Preserva o histórico existente e anexa os novos trâmites criados no modal
        history: [...(proposal?.history || []), ...stagedHistory]
    };

    onSubmit(finalData);
  }

  const statusColor = currentStatusValue ? (statusColors[currentStatusValue.toUpperCase()] || statusColors[currentStatusValue]) : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 px-8">
          <div className="space-y-12 pb-10 pt-6">
            
            {rejectedPrevious && (
                <Alert variant="destructive" className="rounded-3xl border-2 border-red-500 bg-red-50 animate-in slide-in-from-top-4">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="font-black uppercase text-xs">Contrato com Histórico de Reprova</AlertTitle>
                    <AlertDescription className="text-[11px] font-bold text-red-700">
                        Este contrato já foi reprovado anteriormente nesta base. 
                        MOTIVO: <span className="underline">{rejectedPrevious.rejectionReason || "Não informado"}</span>. 
                        Verifique antes de prosseguir com a redigitação.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                <Users className="h-4 w-4" /> Seção 1 – Dados do Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente Selecionado *</FormLabel>
                            <div className="flex items-center gap-3">
                                <FormControl>
                                    <div className="relative flex-1">
                                        <Input readOnly value={selectedCustomer?.name || "Clique em buscar..."} className="h-12 w-full bg-muted/20 font-black rounded-xl border-2 pr-10" />
                                        <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground opacity-20" />
                                    </div>
                                </FormControl>
                                <Button type="button" variant="outline" onClick={onOpenCustomerSearch} disabled={isReadOnly || isSaving} className="h-12 px-6 rounded-xl font-bold border-2 border-primary/20 bg-primary/5">
                                    {field.value ? 'Trocar' : 'Buscar'}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="selectedBenefitNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nº Benefício Vincular</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || !selectedCustomer}>
                                <FormControl>
                                    <SelectTrigger className="h-12 rounded-xl border-2 px-4">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <CreditCard className="h-4 w-4 shrink-0 text-primary/40" />
                                            <SelectValue placeholder="Selecione o benefício..." />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedCustomer?.benefits?.map(b => (
                                        <SelectItem key={b.number} value={b.number} className="py-2.5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="font-black text-sm tracking-tight text-foreground">{b.number}</span>
                                                <span className="text-muted-foreground opacity-40">|</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                                                    {b.species || 'Sem espécie'}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {(!selectedCustomer?.benefits || selectedCustomer.benefits.length === 0) && (
                                        <SelectItem value="none" disabled>Nenhum benefício cadastrado</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Seção 2 – Produto Financeiro
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                      control={form.control}
                      name="product"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Produto *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                          <FormControl><SelectTrigger className="h-12 font-black rounded-xl border-2"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status da Esteira *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                          <FormControl>
                              <SelectTrigger 
                                  className="status-custom font-black text-[10px] uppercase tracking-widest border-2 rounded-full h-12 px-8 transition-all"
                                  style={statusColor ? { '--status-color': statusColor } as any : {}}
                              >
                                  <SelectValue />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>{proposalStatuses.map(s => <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">{s}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )}
                  />
                  {currentStatusValue === 'Reprovado' && (
                      <FormField
                          control={form.control}
                          name="rejectionReason"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-red-600">Motivo da Reprova *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                  <FormControl><SelectTrigger className="h-12 font-black rounded-xl border-2 border-red-200 bg-red-50/30 text-red-700"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                  <SelectContent>{rejectionReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  )}
                </div>

                {productValue === 'Portabilidade' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-blue-50/30 border-2 border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <FormField
                        control={form.control}
                        name="originalContractNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600">N° Contrato Origem (Obrigatório) *</FormLabel>
                                <FormControl><Input placeholder="Número do contrato no banco anterior" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 border-white rounded-xl" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bankOrigin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600">Banco Portado (Origem)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 font-bold border-2 border-white rounded-xl">
                                            <SelectValue placeholder="Selecione o banco de origem..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {banks.map(b => (
                                            <SelectItem key={b} value={b}>
                                                <div className="flex items-center gap-2">
                                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogosSettings} className="h-4 w-4" />
                                                    <span className="font-bold text-xs uppercase">{cleanBankName(b)}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Seção 3 – Dados do Contrato & Valores
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-muted/10 border-2 border-muted">
                    <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor da Parcela *</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                                    <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                    
                    {productValue !== 'Portabilidade' && !productValue.includes('Cartão - Plástico') && (
                        <FormField control={form.control} name="netAmount" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Valor liberado ao cliente *</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                                        <Input type="text" className="h-12 pl-10 font-black border-2 border-emerald-100 bg-emerald-50/20 text-emerald-600 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly} />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )} />
                    )}

                    <FormField control={form.control} name="grossAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {productValue.includes('Cartão') ? 'Limite do Cartão (Bruto) *' : 'Valor Bruto (Contrato) *'}
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-[10px] font-black opacity-30">R$</span>
                                    <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banco Digitado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                            <FormControl>
                                <SelectTrigger className="h-12 font-black border-2 rounded-xl">
                                    <SelectValue placeholder="Banco" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {banks.map(b => (
                                    <SelectItem key={b} value={b}>
                                        <div className="flex items-center gap-2">
                                            <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogosSettings} className="h-4 w-4" />
                                            <span className="font-bold text-xs uppercase">{cleanBankName(b)}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proposalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">N° Proposta *</FormLabel>
                      <FormControl><Input placeholder="000000000" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvingBody"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Órgão Aprovador</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                            <FormControl><SelectTrigger className="h-12 font-black border-2 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{approvingBodies.map(body => <SelectItem key={body} value={body}>{body}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tabela Utilizada *</FormLabel>
                      <FormControl><Input placeholder="Ex: Tabela Flex" {...field} readOnly={isReadOnly} className="h-12 font-bold border-2 rounded-xl" /></FormControl>
                    </FormItem>
                  )}
                />
                
                {productValue !== 'Portabilidade' && (
                    <FormField
                        control={form.control}
                        name="term"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prazo Digitado (Meses) *</FormLabel>
                            <FormControl><Input type="number" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxa de Juros (% a.m)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Input type="number" step="0.01" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl pr-10" />
                            <Percent className="absolute right-4 top-3.5 h-4 w-4 opacity-30" />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {productValue === 'Portabilidade' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-blue-50/30 border-2 border-blue-100">
                      <FormField
                        control={form.control}
                        name="remainingInstallments"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600">Parcelas Restantes</FormLabel>
                                <FormControl><Input type="number" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 border-white rounded-xl" /></FormControl>
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="originalTerm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600">Prazo Contrato Original</FormLabel>
                                <FormControl><Input type="number" {...field} readOnly={isReadOnly} className="h-12 font-black border-2 border-white rounded-xl" /></FormControl>
                            </FormItem>
                        )}
                      />
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                <FormField
                  control={form.control}
                  name="dateDigitized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Digitação *</FormLabel>
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e.target.value))} maxLength={10} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                    </FormItem>
                  )}
                />
                
                {productValue === 'Portabilidade' ? (
                    <>
                        <FormField
                            control={form.control}
                            name="debtBalanceArrivalDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600">Retorno Saldo Devedor</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e.target.value))} maxLength={10} readOnly={isReadOnly} className="h-12 font-black border-2 border-blue-200 bg-blue-50/20 rounded-xl" /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dateApproved"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Averbação</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e.target.value))} maxLength={10} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                                </FormItem>
                            )}
                        />
                    </>
                ) : (
                    <>
                        <FormField
                            control={form.control}
                            name="dateApproved"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Averbação</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e.target.value))} maxLength={10} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="datePaidToClient"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pagamento ao Cliente</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e.target.value))} maxLength={10} readOnly={isReadOnly} className="h-12 font-black border-2 rounded-xl" /></FormControl>
                                </FormItem>
                            )}
                        />
                    </>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" /> Seção 4 – Repasse de Comissionamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-3xl bg-emerald-50/20 border-2 border-emerald-100">
                    <FormField
                        control={form.control}
                        name="commissionBase"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-[10px] font-black uppercase text-emerald-700">Base Cálculo</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isReadOnly}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="gross" id="gross" /><Label htmlFor="gross" className="text-xs font-bold uppercase">Bruto</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="net" id="net" /><Label htmlFor="net" className="text-xs font-bold uppercase">Líquido</Label></div>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commissionPercentage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-emerald-700">Porcentagem (%)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="number" step="0.01" className="h-12 pr-10 font-black border-2 rounded-xl text-emerald-600" {...field} readOnly={isReadOnly} />
                                        <Percent className="absolute right-4 top-3.5 h-4 w-4 text-emerald-600/40" />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commissionValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-emerald-700">Vlr Comissão (R$)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                                        <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl text-emerald-600 bg-emerald-50/50" value={formatCurrencyInput(field.value)} readOnly />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="promoter"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-emerald-700">Promotora *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 font-bold border-2 rounded-xl">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {userSettings?.promoters?.map(p => (
                                            <SelectItem key={p} value={p}>
                                                <div className="flex items-center gap-2">
                                                    <BankIcon bankName={p} domain={userSettings?.promoterDomains?.[p]} showLogo={userSettings?.showPromoterLogos ?? true} className="h-4 w-4" />
                                                    <span className="font-bold text-xs uppercase">{p}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="operator"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-emerald-700">Operador Responsável *</FormLabel>
                                <FormControl><Input placeholder="Nome do digitador" {...field} readOnly={isReadOnly} className="h-12 font-bold border-2 rounded-xl" /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Seção 5 – Check-list Operacional
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { id: 'formalization', label: 'Formalização', icon: Send, color: 'text-blue-500' },
                        { id: 'documentation', label: 'Documentação', icon: FileCheck, color: 'text-orange-500' },
                        { id: 'signature', label: 'Checklist Promotora', icon: PenTool, color: 'text-purple-500' },
                        { id: 'approval', label: 'Averbação', icon: ShieldCheck, color: 'text-green-500' }
                    ].map(step => (
                        <div 
                            key={step.id} 
                            onClick={() => !isReadOnly && setValue(`checklist.${step.id}`, !watch(`checklist.${step.id}`))}
                            className={cn(
                                "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none",
                                watch(`checklist.${step.id}`) 
                                    ? `bg-background border-primary shadow-md` 
                                    : "bg-muted/30 border-transparent opacity-40 grayscale"
                            )}
                        >
                            <step.icon className={cn("h-5 w-5", watch(`checklist.${step.id}`) && step.color)} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                    <FolderLock className="h-4 w-4" /> Seção 6 – Anexos da Proposta
                </h3>
                <ProposalAttachmentUploader 
                    userId={user?.uid || ''} 
                    proposalId={proposal?.id || 'temp'} 
                    initialAttachments={watch('attachments') || []} 
                    onAttachmentsChange={(docs) => setValue('attachments', docs)}
                    isReadOnly={isReadOnly}
                />
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                    <History className="h-4 w-4" /> Seção 7 – Linha do Tempo / Histórico
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {!isReadOnly && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <Zap className="h-3 w-3 fill-current" /> Registrar Trâmite Instantâneo (Linha do Tempo)
                                </h4>
                                
                                <Select onValueChange={(val) => handleAddHistory(val)} value="">
                                    <SelectTrigger className="h-14 rounded-3xl border-2 px-6 font-bold text-sm bg-background shadow-sm hover:border-primary/50 transition-all">
                                        <SelectValue placeholder="Selecione um tópico rápido para o histórico..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2 shadow-xl">
                                        {historyTopics.map((topic) => (
                                            <SelectItem key={topic} value={topic} className="py-3 font-medium cursor-pointer">
                                                {topic}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2 pt-2">
                                    <Input 
                                        placeholder="Ou digite um trâmite personalizado..." 
                                        value={newHistoryEntry} 
                                        onChange={e => setNewHistoryEntry(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddHistory(newHistoryEntry))}
                                        className="h-10 border-2 rounded-xl px-4 text-xs"
                                    />
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        onClick={() => handleAddHistory(newHistoryEntry)} 
                                        disabled={!newHistoryEntry.trim()} 
                                        className="h-10 px-4 rounded-xl font-bold"
                                    >
                                        Registrar
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {displayHistory.map(entry => (
                                <div key={entry.id} className="p-4 rounded-2xl border-2 bg-muted/20 hover:bg-background transition-colors">
                                    <p className="text-[9px] font-black uppercase text-primary/60 mb-1">{format(parseISO(entry.date), "dd/MM/yy HH:mm")} • {entry.userName}</p>
                                    <p className="text-xs font-bold leading-relaxed">{entry.message}</p>
                                </div>
                            ))}
                            {displayHistory.length === 0 && (
                                <div className="py-10 text-center opacity-20 text-[10px] font-black uppercase tracking-widest">Sem registros no histórico.</div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Observações Técnicas Gerais</Label>
                            {!isReadOnly && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 rounded-full text-[10px] font-bold px-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                                    onClick={handleSummarizeObs}
                                    disabled={isSummarizingObs || !watchObservations}
                                >
                                    {isSummarizingObs ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                                    Resumir com IA
                                </Button>
                            )}
                        </div>
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormControl><Textarea placeholder="Detalhes, tokens de acesso ou anotações internas importantes..." {...field} className="min-h-[250px] rounded-3xl border-2 p-6" readOnly={isReadOnly || isSummarizingObs} /></FormControl>
                            )}
                        />
                    </div>
                </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="sticky bottom-0 px-8 py-6 border-t bg-background z-20 flex justify-end">
            {!isReadOnly && (
                <Button type="submit" disabled={isSaving || isSummarizingObs} className="rounded-full px-12 font-black uppercase text-xs tracking-[0.2em] bg-[#00AEEF] hover:bg-[#0096D1] shadow-2xl shadow-[#00AEEF]/30 transition-all border-none h-14">
                    {isSaving ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Gravando...</> : <><Save className="mr-3 h-5 w-5" /> Salvar Proposta</>}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
