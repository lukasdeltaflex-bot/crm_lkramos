'use client';

/**
 * @fileOverview Formulário mestre para criação e edição de propostas.
 * Centraliza toda a lógica de esteira, cálculos de comissão e histórico.
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
    Printer, 
    Loader2, 
    History, 
    FileBadge,
    Calendar as CalendarIcon,
    AlertTriangle,
    MessageSquareQuote,
    Clock,
    FolderLock,
    Info,
    Percent,
    Timer as TimerIcon,
    Wallet,
    TrendingUp,
    CircleDollarSign,
    ListChecks,
    Send,
    FileCheck,
    PenTool,
    ShieldCheck,
    SearchX,
    Zap
} from 'lucide-react';
import { format, parse, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency, cleanBankName, cleanFirestoreData } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, Attachment, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useMemo } from 'react';
import { ProposalAttachmentUploader } from '@/components/proposals/proposal-attachment-uploader';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import { useTheme } from '@/components/theme-provider';
import { Checkbox } from '@/components/ui/checkbox';

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
  proposalNumber: z.string().min(1, "O Nº da proposta é obrigatório."),
  originalContractNumber: z.string().optional(),
  customerId: z.string({ required_error: 'Selecione um cliente.' }),
  product: z.string({ required_error: 'Selecione um produto.' }),
  status: z.string({ required_error: 'Selecione um status.' }),
  rejectionReason: z.string().optional(),
  
  commissionStatus: z.string().optional(),
  amountPaid: z.coerce.number().optional(),
  commissionPaymentDate: z.string().optional(),
  
  selectedBenefitNumber: z.string().optional(),

  table: z.string().min(1, 'A tabela é obrigatória.'),
  term: z.coerce.number().min(1, 'O prazo é obrigatório.'),
  interestRate: z.coerce.number().optional(),

  installmentAmount: z.coerce.number().min(0, 'O valor da parcela é obrigatório.'),
  netAmount: z.coerce.number().min(0, 'O valor líquido é obrigatório.'),
  grossAmount: z.coerce.number().min(0, 'O valor bruto é obrigatório.'),
  
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
  // 🛡️ REGRA 2: Nº Contrato Obrigatório para Portabilidade
  if (data.product === 'Portabilidade' && (!data.originalContractNumber || data.originalContractNumber.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O número do contrato portado é obrigatório para Portabilidade.",
      path: ["originalContractNumber"],
    });
  }

  // 🛡️ REGRA 1: Justificativa Obrigatória para Status Reprovado
  if (data.status === 'Reprovado' && (!data.rejectionReason || data.rejectionReason.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione o motivo da reprova para continuar.",
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
  onSubmit: (data: ProposalFormValues) => void;
  onDuplicate: (proposal: Proposal) => void;
  defaultValues?: ProposalFormData;
  sheetMode: 'new' | 'edit' | 'view';
  onOpenCustomerSearch: () => void;
  selectedCustomerFromSearch: Customer | null;
  onCustomerSearchSelectionHandled: () => void;
  isSaving?: boolean;
}

const applyDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    return value;
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
  const [tempProposalId, setTempProposalId] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState('');
  const [isAddingHistory, setIsAddingHistory] = useState(false);

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

  useEffect(() => {
    if (firestore && !proposal?.id && !tempProposalId) {
      setTempProposalId(doc(collection(firestore, 'loanProposals')).id);
    }
  }, [firestore, proposal, tempProposalId]);
  
  const currentProposalId = proposal?.id || tempProposalId;

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
      product: source?.product || '',
      status: source?.status || 'Em Andamento',
      rejectionReason: source?.rejectionReason || '',
      
      commissionStatus: source?.commissionStatus || '',
      amountPaid: source?.amountPaid || 0,
      commissionPaymentDate: source?.commissionPaymentDate ? formatDateForForm(source.commissionPaymentDate) : '',

      selectedBenefitNumber: source?.selectedBenefitNumber || '',
      table: source?.table || '',
      term: source?.term ?? 84,
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

  const { watch, setValue, trigger } = form;
  const commissionBase = watch('commissionBase');
  const commissionPercentage = watch('commissionPercentage');
  const grossAmount = watch('grossAmount');
  const netAmount = watch('netAmount');
  const productValue = watch('product');
  const selectedCustomerId = watch('customerId');
  const currentStatusValue = watch('status');
  const watchDateDigitized = watch('dateDigitized');
  const watchProposalNumber = watch('proposalNumber');
  const watchOriginalContract = watch('originalContractNumber');
  const checklist = watch('checklist') || {};

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const historicalRejection = useMemo(() => {
    if (!watchOriginalContract || watchOriginalContract.trim() === '' || productValue !== 'Portabilidade') return null;
    const cleanCurrent = watchOriginalContract.trim().toUpperCase();
    
    return allProposals.find(p => 
        p.originalContractNumber?.trim().toUpperCase() === cleanCurrent && 
        p.status === 'Reprovado' &&
        p.id !== proposal?.id
    );
  }, [watchOriginalContract, allProposals, proposal?.id, productValue]);

  const isDuplicateProposal = useMemo(() => {
    const cleanNum = watchProposalNumber?.trim().toUpperCase();
    if (!cleanNum || cleanNum === '') return false;
    
    return allProposals.some(p => {
        if (proposal?.id && p.id === proposal.id) return false;
        return p.proposalNumber?.trim().toUpperCase() === cleanNum;
    });
  }, [watchProposalNumber, allProposals, proposal?.id]);

  useEffect(() => {
    // 🛡️ [LÓGICA]: Limpa número de benefício ao trocar o cliente para evitar dados cruzados
    setValue('selectedBenefitNumber', '');
    
    if (selectedCustomer) {
        const benefits = selectedCustomer.benefits || [];
        if (benefits.length === 1) {
            setValue('selectedBenefitNumber', benefits[0].number, { shouldValidate: true });
        }
    }
  }, [selectedCustomerId, selectedCustomer, setValue]);

  useEffect(() => {
    if (sheetMode === 'new' && !watchDateDigitized) {
        setValue('dateDigitized', format(new Date(), 'dd/MM/yyyy'), { shouldValidate: true });
    }
  }, [sheetMode, setValue, watchDateDigitized]);

  useEffect(() => {
    if (selectedCustomerFromSearch) {
        setValue('customerId', selectedCustomerFromSearch.id, { shouldValidate: true });
        trigger('customerId');
        onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, setValue, trigger, onCustomerSearchSelectionHandled]);

  useEffect(() => {
    if (isReadOnly) return;
    let baseValue = 0;
    if (commissionBase === 'gross') baseValue = grossAmount || 0;
    else if (commissionBase === 'net') baseValue = netAmount || 0;

    if (baseValue > 0 && commissionPercentage >= 0) {
        const calculatedCommission = parseFloat((baseValue * (commissionPercentage / 100)).toFixed(2));
        if (form.getValues('commissionValue') !== calculatedCommission) {
            setValue('commissionValue', calculatedCommission, { shouldValidate: true });
        }
    }
  }, [commissionBase, commissionPercentage, grossAmount, netAmount, setValue, isReadOnly]);

  function handleFormSubmit(data: ProposalFormValues) {
    if (isDuplicateProposal) {
        toast({
            variant: 'destructive',
            title: '⚠️ BLOQUEIO DE SEGURANÇA',
            description: 'Já existe uma proposta cadastrada com este número exato.'
        });
        return;
    }

    const convertToIso = (dateStr?: string) => {
        if (!dateStr || dateStr.trim() === '') return null;
        try {
            const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
            return isValid(parsed) ? parsed.toISOString() : null;
        } catch { return null; }
    }

    const now = new Date().toISOString();
    
    // 🛡️ CORREÇÃO DO BUG 1: Limpeza de dados fantasmas de reprova
    const finalData: any = {
        ...data,
        rejectionReason: data.status === 'Reprovado' ? data.rejectionReason : "",
        dateDigitized: convertToIso(data.dateDigitized) || now,
        dateApproved: convertToIso(data.dateApproved),
        datePaidToClient: convertToIso(data.datePaidToClient),
        debtBalanceArrivalDate: convertToIso(data.debtBalanceArrivalDate),
        commissionPaymentDate: convertToIso(data.commissionPaymentDate),
    };

    const isAverbado = !!finalData.dateApproved;
    const isNotReprovado = finalData.status !== 'Reprovado';

    if (isNotReprovado && isAverbado) {
        if (!finalData.commissionStatus || finalData.commissionStatus === '') {
            finalData.commissionStatus = 'Pendente';
        }
    }

    const auditEntries: ProposalHistoryEntry[] = [];
    const userName = user?.displayName || user?.email || 'Sistema';

    const checkChange = (field: string, label: string, formatter?: (v: any) => string) => {
        const oldVal = proposal ? (proposal as any)[field] : undefined;
        const newVal = (finalData as any)[field];
        if (oldVal !== undefined && oldVal !== newVal) {
            auditEntries.push({
                id: crypto.randomUUID(),
                date: now,
                message: `AUTOAUDIT: ${label} alterado de "${formatter ? formatter(oldVal) : oldVal}" para "${formatter ? formatter(newVal) : newVal}"`,
                userName
            });
        }
    };

    if (proposal) {
        checkChange('status', 'Status');
        checkChange('bank', 'Banco');
        checkChange('grossAmount', 'Valor Bruto', formatCurrency);
        checkChange('netAmount', 'Valor Líquido', formatCurrency);
        checkChange('promoter', 'Promotora');
        if (finalData.status === 'Reprovado') {
            auditEntries.push({
                id: crypto.randomUUID(),
                date: now,
                message: `MOTIVO DA REPROVA: ${finalData.rejectionReason}`,
                userName
            });
        }
    } else {
        auditEntries.push({
            id: crypto.randomUUID(),
            date: now,
            message: `Proposta criada no sistema com status inicial: ${finalData.status}`,
            userName
        });
    }

    const existingHistory = Array.isArray(proposal?.history) ? proposal!.history : [];
    finalData.history = [...existingHistory, ...auditEntries];
    
    if (proposal?.status !== finalData.status) {
        finalData.statusUpdatedAt = now;
    }

    onSubmit(cleanFirestoreData(finalData));
  }

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setValue('attachments', attachments, { shouldValidate: true });
  };

  const handleAddHistory = async (customMessage?: string) => {
    const messageToAdd = customMessage || newHistoryEntry.trim();
    if (!messageToAdd || !proposal?.id || !firestore) return;
    
    setIsAddingHistory(true);
    const now = new Date().toISOString();
    const entry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: messageToAdd,
        userName: user?.displayName || user?.email || 'Agente'
    };
    const docRef = doc(firestore, 'loanProposals', proposal.id);
    const updateData = { history: arrayUnion(entry), statusUpdatedAt: now };
    updateDoc(docRef, updateData)
        .then(() => { 
            if (!customMessage) setNewHistoryEntry(''); 
            toast({ title: "Histórico Atualizado" }); 
        })
        .finally(() => setIsAddingHistory(false));
  };

  const statusColor = currentStatusValue ? (statusColors[currentStatusValue.toUpperCase()] || statusColors[currentStatusValue]) : undefined;

  const toggleChecklistItem = (id: string) => {
    if (isReadOnly) return;
    const newChecklist = { ...checklist, [id]: !checklist[id] };
    setValue('checklist', newChecklist, { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[70vh] pr-4 print:h-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <FolderLock className="h-4 w-4" /> Registro LK RAMOS
              </h3>
              
              {historicalRejection && (
                  <Alert variant="destructive" className="border-2 animate-in slide-in-from-top-2 duration-500 rounded-2xl bg-red-50 dark:bg-red-900/20">
                      <SearchX className="h-5 w-5 text-red-600" />
                      <AlertTitle className="font-black uppercase text-xs tracking-widest">Contrato Já Reprovado!</AlertTitle>
                      <AlertDescription className="text-xs font-medium">
                          Este número de contrato foi reprovado anteriormente na <span className="font-black">Prop. {historicalRejection.proposalNumber}</span>.
                          <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded border border-red-200">
                              <span className="font-black text-[10px] uppercase text-red-700">Motivo:</span>
                              <p className="font-bold text-red-600 italic">"{historicalRejection.rejectionReason || 'Não especificado'}"</p>
                          </div>
                      </AlertDescription>
                  </Alert>
              )}

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cliente Selecionado *</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input readOnly value={selectedCustomer?.name || "Nenhum cliente selecionado"} className="flex-1 bg-muted/30 font-bold" />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={onOpenCustomerSearch} disabled={isReadOnly || isSaving} className="font-bold">
                                {field.value ? 'Trocar' : 'Buscar'} Cliente
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Produto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                        <FormControl><SelectTrigger className="font-bold"><SelectValue placeholder="Produto" /></SelectTrigger></FormControl>
                        <SelectContent>{productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status da Esteira *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                        <FormControl>
                            <SelectTrigger 
                                className="status-custom font-black text-[10px] uppercase tracking-widest border-2 rounded-full h-10 px-6 transition-all"
                                style={statusColor ? { '--status-color': statusColor } as any : {}}
                            >
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>{proposalStatuses.map(s => <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">{s}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}
                />
              </div>

              {currentStatusValue === 'Reprovado' && (
                  <FormField
                    control={form.control}
                    name="rejectionReason"
                    render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-left-2 duration-300">
                            <FormLabel className="text-red-600 font-black uppercase text-[10px] tracking-widest">Motivo Obrigatório da Reprova *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                                <FormControl>
                                    <SelectTrigger className="border-red-200 bg-red-50/50 font-bold h-11 rounded-xl">
                                        <SelectValue placeholder="Selecione por que foi reprovado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {rejectionReasons.map(reason => <SelectItem key={reason} value={reason} className="font-medium">{reason}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
              )}
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Check-list Operacional
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { id: 'formalization', label: 'Formalização', icon: Send },
                        { id: 'documentation', label: 'Documentos', icon: FileCheck },
                        { id: 'signature', label: 'Checklist Promotora', icon: PenTool },
                        { id: 'approval', label: 'Averbação', icon: ShieldCheck }
                    ].map((step) => (
                        <Button
                            key={step.id}
                            type="button"
                            variant="outline"
                            className={cn(
                                "flex flex-col h-20 gap-2 border-2 transition-all rounded-2xl",
                                checklist[step.id] 
                                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20" 
                                    : "border-muted-foreground/10 text-muted-foreground opacity-60"
                            )}
                            onClick={() => toggleChecklistItem(step.id)}
                            disabled={isReadOnly || isSaving}
                        >
                            <step.icon className={cn("h-5 w-5", checklist[step.id] ? "animate-in zoom-in" : "")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <Clock className="h-4 w-4" /> DIGITAÇÃO OFERTA CONSIGNADO
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="selectedBenefitNumber"
                  render={({ field }) => (
                    <FormItem><FormLabel>Nº do Benefício (NB)</FormLabel>
                      {selectedCustomer && selectedCustomer.benefits && selectedCustomer.benefits.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                          <FormControl><SelectTrigger className="font-mono font-bold"><SelectValue placeholder="Selecionar NB" /></SelectTrigger></FormControl>
                          <SelectContent>{selectedCustomer.benefits.map(benefit => (
                              <SelectItem key={benefit.number} value={benefit.number}>{benefit.number}</SelectItem>
                            ))}</SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input placeholder="Sem NB vinculado" {...field} value={field.value ?? ''} className="font-mono" readOnly={isReadOnly || isSaving} disabled={isReadOnly || !selectedCustomerId || isSaving}/></FormControl>
                      )}<FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvingBody"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Órgão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                            <FormControl><SelectTrigger className="font-bold"><SelectValue placeholder="Órgão" /></SelectTrigger></FormControl>
                            <SelectContent>{approvingBodies.map(body => <SelectItem key={body} value={body}>{body}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Banco Digitado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                            <FormControl><SelectTrigger className="font-bold"><SelectValue placeholder="Banco" /></SelectTrigger></FormControl>
                            <SelectContent>{banks.map(b => (
                                <SelectItem key={b} value={b}>
                                    <div className="flex items-center gap-2">
                                        <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                        <span>{cleanBankName(b)}</span>
                                    </div>
                                </SelectItem>
                            ))}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {productValue === 'Portabilidade' ? (
                    <>
                        <FormField
                            control={form.control}
                            name="bankOrigin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Banco Portado (Origem)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                                        <FormControl><SelectTrigger className="font-bold"><SelectValue placeholder="Origem" /></SelectTrigger></FormControl>
                                        <SelectContent>{banks.map(b => (
                                            <SelectItem key={b} value={b}>
                                                <div className="flex items-center gap-2">
                                                    <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogo={showLogos} className="h-4 w-4" />
                                                    <span>{cleanBankName(b)}</span>
                                                </div>
                                            </SelectItem>
                                        ))}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="originalContractNumber"
                            render={({ field }) => (
                                <FormItem className="animate-in zoom-in-95 duration-300">
                                <FormLabel className="text-primary font-black uppercase text-[10px] tracking-widest">Nº Contrato Portado (Origem) *</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            placeholder="Nº Contrato Banco Origem" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            readOnly={isReadOnly || isSaving} 
                                            className={cn("font-bold border-primary/20 bg-primary/[0.02]", historicalRejection && "border-red-500 bg-red-50 ring-2 ring-red-200")}
                                        />
                                        {historicalRejection && <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 animate-pulse" />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                ) : <div className="hidden md:block" />}
                
                <FormField
                  control={form.control}
                  name="proposalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Proposta (Nova) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Input 
                                placeholder="Contrato Novo" 
                                {...field} 
                                value={field.value ?? ''} 
                                readOnly={isReadOnly || isSaving} 
                                className={cn("font-bold", isDuplicateProposal && "border-red-500 bg-red-50")}
                            />
                            {isDuplicateProposal && (
                                <AlertTriangle className="absolute right-3 top-2.5 h-5 w-5 text-red-500 animate-pulse" />
                            )}
                        </div>
                      </FormControl>
                      {isDuplicateProposal && (
                          <p className="text-[10px] font-bold text-red-600 uppercase mt-1 animate-in slide-in-from-top-1">⚠️ Este número já existe em sua base.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem><FormLabel>Tabela *</FormLabel><FormControl><Input placeholder="Tabela" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} className="font-bold"/></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor Parcela *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="number" step="0.01" className="pl-9 font-bold rounded-full" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="netAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Líquido (Cliente) *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="number" step="0.01" className="pl-9 font-bold rounded-full" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
                 <FormField control={form.control} name="grossAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bruto (Base) *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="number" step="0.01" className="pl-9 font-bold rounded-full" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><TimerIcon className="h-3.5 w-3.5" /> Prazo (Meses) *</FormLabel>
                        <FormControl><Input type="number" {...field} readOnly={isReadOnly || isSaving} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Percent className="h-3.5 w-3.5" /> Taxa de Juros (%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateDigitized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Digitação *</FormLabel>
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                      <FormMessage />
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
                                <FormLabel>Retorno Saldo</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dateApproved"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Averbação</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
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
                                <FormLabel>Data Averbação</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="datePaidToClient"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Pagamento Cliente</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem><FormLabel>Operador *</FormLabel><FormControl><Input placeholder="Nome do Agente" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="promoter"
                  render={({ field }) => (
                    <FormItem><FormLabel>Promotora *</FormLabel><FormControl><Input placeholder="Nome da Promotora" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" /> REGRAS DE COMISSIONAMENTO
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="commissionBase" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Base do Cálculo *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? 'gross'} disabled={isReadOnly || isSaving}>
                                <FormControl><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="gross">Sobre o Bruto</SelectItem>
                                    <SelectItem value="net">Sobre o Líquido</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="commissionPercentage" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (%) *</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="number" step="0.01" className="pr-8 font-bold" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                    <span className="absolute right-3 top-2.5 text-[10px] font-black text-muted-foreground">%</span>
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="commissionValue" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (R$) *</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9 font-black text-primary" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <History className="h-4 w-4" /> Linha do Tempo
                </h3>
                {proposal?.id && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl border-2 border-dashed bg-muted/5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tópicos Rápidos (Sub-status)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {historyTopics.map((topic) => (
                                    <Button
                                        key={topic}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-full text-[10px] font-bold px-4 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all"
                                        onClick={() => handleAddHistory(topic)}
                                        disabled={isAddingHistory || isReadOnly}
                                    >
                                        {topic}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input 
                                placeholder="Ou digite uma atualização personalizada..." 
                                value={newHistoryEntry} 
                                onChange={e => setNewHistoryEntry(e.target.value)} 
                                disabled={isAddingHistory || isReadOnly}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHistory())}
                            />
                            <Button type="button" size="sm" onClick={() => handleAddHistory()} disabled={isAddingHistory || !newHistoryEntry.trim() || isReadOnly}>
                                {isAddingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {proposal.history && Array.isArray(proposal.history) && proposal.history.length > 0 ? (
                                [...proposal.history].sort((a,b) => b.date.localeCompare(a.date)).map(entry => (
                                    <div key={entry.id} className={cn(
                                        "p-3 rounded-xl border text-xs transition-colors hover:bg-muted/50",
                                        entry.message.startsWith("AUTOAUDIT") ? "bg-blue-50/30 border-blue-100" : "bg-muted/30 border-border"
                                    )}>
                                        <div className="flex justify-between font-black uppercase text-primary/70 mb-1">
                                            <span className="flex items-center gap-1.5"><MessageSquareQuote className="h-3 w-3" />{entry.userName || 'Agente'}</span>
                                            <span className="opacity-60">{format(parseISO(entry.date), "dd/MM/yy HH:mm")}</span>
                                        </div>
                                        <p className={cn(
                                            "leading-relaxed font-medium",
                                            entry.message.startsWith("AUTOAUDIT") ? "text-blue-700 italic" : "text-foreground"
                                        )}>
                                            {entry.message.replace("AUTOAUDIT: ", "⚙️ ")}
                                        </p>
                                    </div>
                                ))
                            ) : <p className="text-center text-[10px] text-muted-foreground uppercase py-6 border-2 border-dashed rounded-lg opacity-40">Sem trâmites registrados nesta proposta.</p>}
                        </div>
                    </div>
                )}
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <FolderLock className="h-4 w-4" /> Documentação
                </h3>
                {!currentProposalId ? (
                    <Alert className="bg-secondary/50 border-none">
                        <div className="flex items-center gap-3">
                            <div className="mt-1 shrink-0"><Info className="h-4 w-4" /></div>
                            <div>
                                <AlertTitle className="text-xs font-bold uppercase">Upload Bloqueado</AlertTitle>
                                <AlertDescription className='text-[10px]'>Salve a proposta antes de anexar arquivos.</AlertDescription>
                            </div>
                        </div>
                    </Alert>
                ) : (
                    <ProposalAttachmentUploader 
                        userId={user!.uid} 
                        proposalId={currentProposalId!} 
                        initialAttachments={form.getValues('attachments') || []} 
                        onAttachmentsChange={handleAttachmentsChange} 
                        isReadOnly={isReadOnly || isSaving} 
                    />
                )}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end items-center pt-8 border-t bg-background">
            {!isReadOnly && (
                <Button 
                    type="submit" 
                    disabled={isSaving || isDuplicateProposal} 
                    className="rounded-full px-10 font-black uppercase tracking-widest bg-[#00AEEF] hover:bg-[#0096D1] shadow-lg shadow-[#00AEEF]/20 transition-all border-none"
                >
                    {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</> : 'Salvar Proposta'}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
