
'use client';

/**
 * @fileOverview Formulário mestre para criação e edição de propostas.
 * Centraliza toda a lógica de esteira, cálculos de comissão e histórico com AUTO-AUDIT.
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
    MessageSquareText,
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
    Zap,
    Save,
    Landmark
} from 'lucide-react';
import { format, parse, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency, cleanBankName, cleanFirestoreData, formatCurrencyInput } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, Attachment, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useMemo, useRef } from 'react';
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
    let value = e.target.value.replace(/\D/g, "").substring(0, 8);
    if (value.length > 4) value = value.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3');
    else if (value.length > 2) value = value.replace(/(\d{2})(\d)/, '$1/$2');
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
  const [stagedHistory, setStagedHistory] = useState<ProposalHistoryEntry[]>([]);

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

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const isDuplicateProposal = useMemo(() => {
    const cleanNum = (watchProposalNumber || '').trim().toUpperCase().replace(/[-\s]/g, '');
    if (!cleanNum || cleanNum.length < 3) return false;
    
    return allProposals.some(p => {
        if (proposal?.id && p.id === proposal.id) return false;
        const existingNum = (p.proposalNumber || '').trim().toUpperCase().replace(/[-\s]/g, '');
        return existingNum === cleanNum;
    });
  }, [watchProposalNumber, allProposals, proposal?.id]);

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

  const handleAddHistory = (customMessage: string) => {
    if (!customMessage || !user) return;
    
    setIsAddingHistory(true);
    const now = new Date().toISOString();
    const entry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: customMessage,
        userName: user.displayName || user.email || 'Agente'
    };

    setStagedHistory(prev => [entry, ...prev]);
    setNewHistoryEntry('');

    if (proposal?.id && firestore) {
        const docRef = doc(firestore, 'loanProposals', proposal.id);
        updateDoc(docRef, {
            history: arrayUnion(entry)
        }).catch(async (e) => {
            setStagedHistory(prev => prev.filter(item => item.id !== entry.id));
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: { history: arrayUnion(entry) }
            }));
        }).finally(() => {
            setIsAddingHistory(false);
        });
    } else {
        setIsAddingHistory(false);
    }
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

    const now = new Date().toISOString();
    const finalData: any = {
        ...data,
        dateDigitized: convertToIso(data.dateDigitized) || now,
        dateApproved: convertToIso(data.dateApproved),
        datePaidToClient: convertToIso(data.datePaidToClient),
        debtBalanceArrivalDate: convertToIso(data.debtBalanceArrivalDate),
        commissionPaymentDate: convertToIso(data.commissionPaymentDate),
    };

    const existingHistory = Array.isArray(proposal?.history) ? proposal!.history : [];
    finalData.history = [...existingHistory, ...stagedHistory];
    
    onSubmit(cleanFirestoreData(finalData));
  }

  const statusColor = currentStatusValue ? (statusColors[currentStatusValue.toUpperCase()] || statusColors[currentStatusValue]) : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 px-8">
          <div className="space-y-10 pb-10 pt-4">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                <FolderLock className="h-4 w-4" /> Registro LK RAMOS
              </h3>
              
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Cliente Selecionado *</FormLabel>
                        <div className="flex items-center gap-3">
                            <FormControl>
                                <Input readOnly value={selectedCustomer?.name || "Nenhum cliente selecionado"} className="h-12 flex-1 bg-muted/30 font-black rounded-xl border-2" />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={onOpenCustomerSearch} disabled={isReadOnly || isSaving} className="h-12 px-6 rounded-xl font-bold border-2 border-primary/20 bg-primary/5 text-primary">
                                {field.value ? 'Trocar' : 'Buscar'} Cliente
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Produto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                        <FormControl><SelectTrigger className="h-12 font-black rounded-xl border-2"><SelectValue placeholder="Produto" /></SelectTrigger></FormControl>
                        <SelectContent>{productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Status da Esteira *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                        <FormControl>
                            <SelectTrigger 
                                className="status-custom font-black text-[10px] uppercase tracking-widest border-2 rounded-full h-12 px-8 transition-all"
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

              {productValue === 'Portabilidade' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-blue-50/30 border-2 border-blue-100 animate-in slide-in-from-top-2 duration-500">
                      <FormField
                        control={form.control}
                        name="originalContractNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-2">N° Contrato Portado *</FormLabel>
                                <FormControl><Input placeholder="Contrato de Origem" {...field} className="h-12 font-black border-2 rounded-xl" readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankOrigin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-2">Banco de Origem</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                                    <FormControl><SelectTrigger className="h-12 font-black border-2 rounded-xl"><SelectValue placeholder="Selecione o banco anterior" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {banks.map(b => (
                                            <SelectItem key={b} value={b}>{cleanBankName(b)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                      />
                  </div>
              )}
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                <Clock className="h-4 w-4" /> DIGITAÇÃO DA PROPOSTA
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="approvingBody"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Órgão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                            <FormControl><SelectTrigger className="h-12 font-black border-2 rounded-xl"><SelectValue placeholder="Órgão" /></SelectTrigger></FormControl>
                            <SelectContent>{approvingBodies.map(body => <SelectItem key={body} value={body}>{body}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Banco Digitado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                            <FormControl>
                                <SelectTrigger className="h-12 font-black w-full overflow-hidden border-2 rounded-xl">
                                    <SelectValue placeholder="Banco" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {banks.map(b => (
                                    <SelectItem key={b} value={b}>
                                        <div className="flex items-center gap-3 w-full overflow-hidden">
                                            <BankIcon bankName={b} domain={userSettings?.bankDomains?.[b]} showLogos={showLogos} className="h-4 w-4 shrink-0" />
                                            <span className="truncate flex-1 font-bold text-xs">{cleanBankName(b)}</span>
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">N° de Proposta *</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Input placeholder="Ex: 830310745" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} className={cn("h-12 font-black border-2 rounded-xl", isDuplicateProposal && "border-red-500 bg-red-50")} />
                            {isDuplicateProposal && <AlertTriangle className="absolute right-4 top-3.5 h-5 w-5 text-red-500 animate-pulse" />}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="grossAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Vlr Bruto (Base Cálculo) *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="netAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Vlr Líquido *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Vlr Parcela *</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-[10px] font-black text-muted-foreground">R$</span>
                                <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl" value={formatCurrencyInput(field.value)} onChange={(e) => field.onChange(parseInt(e.target.value.replace(/\D/g, "")) / 100 || 0)} readOnly={isReadOnly || isSaving} />
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="dateDigitized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Digitação *</FormLabel>
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} className="h-12 font-black border-2 rounded-xl" readOnly={isReadOnly || isSaving} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="dateApproved"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Averbação</FormLabel>
                        <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} className="h-12 font-black border-2 rounded-xl" readOnly={isReadOnly || isSaving} /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="datePaidToClient"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Pgto Cliente</FormLabel>
                        <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} className="h-12 font-black border-2 rounded-xl" readOnly={isReadOnly || isSaving} /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="debtBalanceArrivalDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", productValue === 'Portabilidade' ? "text-blue-600" : "text-muted-foreground")}>Chegada Saldo</FormLabel>
                        <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} className="h-12 font-black border-2 rounded-xl" readOnly={isReadOnly || isSaving} disabled={productValue !== 'Portabilidade'} /></FormControl>
                        </FormItem>
                    )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" /> REPASSE DE COMISSIONAMENTO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-emerald-50/20 border-2 border-emerald-100">
                    <FormField
                        control={form.control}
                        name="commissionBase"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Base de Cálculo *</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex gap-4"
                                        disabled={isReadOnly || isSaving}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="gross" id="gross" />
                                            <Label htmlFor="gross" className="text-xs font-bold uppercase">Bruto</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="net" id="net" />
                                            <Label htmlFor="net" className="text-xs font-bold uppercase">Líquido</Label>
                                        </div>
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Porcentagem (%) *</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="number" step="0.01" className="h-12 pr-10 font-black border-2 rounded-xl text-emerald-600" {...field} readOnly={isReadOnly || isSaving} />
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Valor Comissão (R$) *</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-[10px] font-black text-emerald-600/40">R$</span>
                                        <Input type="text" className="h-12 pl-10 font-black border-2 rounded-xl text-emerald-600 bg-emerald-50/50" value={formatCurrencyInput(field.value)} readOnly />
                                    </div>
                                </FormControl>
                                <FormDescription className="text-[9px] uppercase font-bold text-emerald-600/60">Cálculo automático</FormDescription>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commissionStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Status Pgto</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                                    <FormControl><SelectTrigger className="h-12 font-black border-2 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {configData.commissionStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                    <History className="h-4 w-4" /> Histórico & Anotações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        {!isReadOnly && (
                            <div className="flex gap-3">
                                <Input placeholder="Nova atualização..." value={newHistoryEntry} onChange={e => setNewHistoryEntry(e.target.value)} disabled={isAddingHistory} className="h-12 border-2 rounded-xl px-5 font-medium" />
                                <Button type="button" size="icon" onClick={() => handleAddHistory(newHistoryEntry)} disabled={isAddingHistory || !newHistoryEntry.trim()} className="h-12 w-12 rounded-xl bg-primary shadow-lg"><Check className="h-5 w-5" /></Button>
                            </div>
                        )}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {displayHistory.map(entry => (
                                <div key={entry.id} className="p-4 rounded-2xl border-2 bg-muted/20 hover:shadow-md transition-all">
                                    <p className="text-[9px] font-black uppercase text-primary/60 mb-1">{format(parseISO(entry.date), "dd/MM/yy HH:mm")} • {entry.userName}</p>
                                    <p className="text-xs font-bold leading-relaxed">{entry.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Observações Adicionais</FormLabel>
                                <FormControl><Textarea placeholder="Detalhes técnicos, links ou lembretes..." {...field} className="min-h-[200px] rounded-2xl border-2 p-5" readOnly={isReadOnly || isSaving} /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 px-8 py-6 border-t bg-background z-20 flex justify-end">
            {!isReadOnly && (
                <Button type="submit" disabled={isSaving || isDuplicateProposal} className="rounded-full px-12 font-black uppercase text-xs tracking-[0.2em] bg-[#00AEEF] hover:bg-[#0096D1] shadow-2xl shadow-[#00AEEF]/30 transition-all border-none h-14">
                    {isSaving ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Salvando...</> : <><Save className="mr-3 h-5 w-5" /> Salvar Proposta</>}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
