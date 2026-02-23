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
    Copy, 
    Printer, 
    Loader2, 
    History, 
    FileBadge,
    Calendar as CalendarIcon,
    AlertTriangle,
    MessageSquareQuote,
    Clock,
    FolderLock,
    Info
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
  proposalNumber: z.string().min(1, "O número da proposta é obrigatório."),
  customerId: z.string({ required_error: 'Selecione um cliente.' }),
  product: z.string({ required_error: 'Selecione um produto.' }),
  status: z.string({ required_error: 'Selecione um status.' }),
  commissionStatus: z.string().optional(),
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
      const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }, { message: 'Data inválida. Use o formato dd/mm/aaaa.' }),
  dateApproved: optionalDateString,
  datePaidToClient: optionalDateString,
  debtBalanceArrivalDate: optionalDateString,
  
  attachments: z.array(attachmentSchema).optional(),
  observations: z.string().optional(),
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
  const isAttachmentSectionDisabled = !currentProposalId;

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      proposalNumber: '',
      customerId: '',
      product: '',
      status: 'Em Andamento',
      commissionStatus: 'Pendente',
      selectedBenefitNumber: '',
      table: '',
      term: 84,
      interestRate: 0,
      grossAmount: 0,
      netAmount: 0,
      installmentAmount: 0,
      commissionBase: 'gross',
      commissionPercentage: 0,
      commissionValue: 0,
      promoter: '',
      bank: '',
      bankOrigin: '',
      approvingBody: 'INSS',
      operator: '',
      dateDigitized: format(new Date(), 'dd/MM/yyyy'),
      dateApproved: '',
      datePaidToClient: '',
      debtBalanceArrivalDate: '',
      attachments: [],
      observations: '',
    },
  });

  const { watch, setValue, trigger } = form;
  const commissionBase = watch('commissionBase');
  const commissionPercentage = watch('commissionPercentage');
  const grossAmount = watch('grossAmount');
  const netAmount = watch('netAmount');
  const productValue = watch('product');
  const selectedCustomerId = watch('customerId');
  const currentStatusValue = watch('status');
  const proposalNumberValue = watch('proposalNumber');

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);
  
  const selectedCustomerName = useMemo(() => {
    if (!selectedCustomerId) return "Nenhum cliente selecionado";
    return customers.find(c => c.id === selectedCustomerId)?.name || "Cliente não encontrado";
  }, [customers, selectedCustomerId]);

  const duplicateProposal = useMemo(() => {
    if (!proposalNumberValue || proposalNumberValue.length < 3) return null;
    return allProposals.find(p => 
        p.proposalNumber.trim() === proposalNumberValue.trim() && 
        p.id !== (proposal?.id || "")
    );
  }, [proposalNumberValue, allProposals, proposal?.id]);

  useEffect(() => {
    if (selectedCustomer) {
        const benefits = selectedCustomer.benefits || [];
        if (benefits.length === 1) {
            setValue('selectedBenefitNumber', benefits[0].number, { shouldValidate: true });
        } else if (!benefits.some(b => b.number === form.getValues('selectedBenefitNumber'))) {
            setValue('selectedBenefitNumber', '', { shouldValidate: true });
        }
    } else {
        setValue('selectedBenefitNumber', '', { shouldValidate: true });
    }
  }, [selectedCustomer, setValue]);

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

  useEffect(() => {
    const source = proposal || defaultValues;
    if (source) {
        form.reset({
            proposalNumber: source.proposalNumber || '',
            customerId: source.customerId || '',
            product: source.product || '',
            status: source.status || 'Em Andamento',
            commissionStatus: source.commissionStatus || 'Pendente',
            selectedBenefitNumber: source.selectedBenefitNumber || '',
            table: source.table || '',
            term: source.term ?? 84,
            interestRate: source.interestRate ?? 0,
            grossAmount: source.grossAmount ?? 0,
            netAmount: source.netAmount ?? 0,
            installmentAmount: source.installmentAmount ?? 0,
            commissionBase: source.commissionBase || 'gross',
            commissionPercentage: source.commissionPercentage ?? 0,
            commissionValue: source.commissionValue ?? 0,
            promoter: source.promoter || '',
            bank: source.bank || '',
            bankOrigin: source.bankOrigin || '',
            approvingBody: source.approvingBody || 'INSS',
            operator: source.operator || '',
            dateDigitized: source.dateDigitized ? formatDateForForm(source.dateDigitized) : (isClient ? format(new Date(), 'dd/MM/yyyy') : ''),
            dateApproved: formatDateForForm(source.dateApproved),
            datePaidToClient: formatDateForForm(source.datePaidToClient),
            debtBalanceArrivalDate: formatDateForForm(source.debtBalanceArrivalDate),
            attachments: source.attachments || [],
            observations: source.observations || '',
        });
    }
  }, [proposal, defaultValues, form, isClient]);

  function handleFormSubmit(data: ProposalFormValues) {
    if (duplicateProposal) {
        toast({ variant: 'destructive', title: 'Proposta Duplicada', description: `O número ${data.proposalNumber} já existe.` });
        return;
    }

    const convertToIso = (dateStr?: string) => {
        if (!dateStr || dateStr.trim() === '') return null;
        try {
            const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
            return isValid(parsed) ? parsed.toISOString() : null;
        } catch { return null; }
    }

    const finalData = cleanFirestoreData({
        ...data,
        dateDigitized: convertToIso(data.dateDigitized) || new Date().toISOString(),
        dateApproved: convertToIso(data.dateApproved),
        datePaidToClient: convertToIso(data.datePaidToClient),
        debtBalanceArrivalDate: convertToIso(data.debtBalanceArrivalDate),
    });

    onSubmit(finalData);
  }

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setValue('attachments', attachments, { shouldValidate: true });
  };

  const handleAddHistory = async () => {
    if (!newHistoryEntry.trim() || !proposal?.id || !firestore) return;
    setIsAddingHistory(true);
    const now = new Date().toISOString();
    const entry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: now,
        message: newHistoryEntry.trim(),
        userName: user?.displayName || user?.email || 'Usuário'
    };
    const docRef = doc(firestore, 'loanProposals', proposal.id);
    const updateData = { history: arrayUnion(entry), statusUpdatedAt: now };
    updateDoc(docRef, updateData)
        .then(() => { setNewHistoryEntry(''); toast({ title: "Histórico Atualizado" }); })
        .catch((err) => console.error(err))
        .finally(() => setIsAddingHistory(false));
  };

  const handleExportCover = async () => {
    if (!proposal || !selectedCustomer || !user) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const primaryColor = [0, 174, 239];
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CAPA DE PROPOSTA", 14, 25);
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Gerado por: ${user.displayName || user.email}`, 14, 50);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 55);
    
    doc.setDrawColor(200);
    doc.line(14, 60, 196, 60);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 14, 75);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${selectedCustomer.name}`, 14, 85);
    doc.text(`CPF: ${selectedCustomer.cpf}`, 14, 92);
    doc.text(`Telefone: ${selectedCustomer.phone}`, 14, 99);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA OPERAÇÃO", 14, 115);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº Proposta: ${proposal.proposalNumber}`, 14, 125);
    doc.text(`Produto: ${proposal.product}`, 14, 132);
    doc.text(`Banco: ${cleanBankName(proposal.bank)}`, 14, 139);
    doc.text(`Valor Bruto: ${formatCurrency(proposal.grossAmount)}`, 14, 146);
    doc.text(`Valor Líquido: ${formatCurrency(proposal.netAmount)}`, 14, 153);
    doc.text(`Prazo: ${proposal.term} meses`, 14, 160);
    
    doc.save(`Capa_Proposta_${proposal.proposalNumber}.pdf`);
    toast({ title: "Capa Gerada!" });
  };

  const statusColor = currentStatusValue ? (statusColors[currentStatusValue.toUpperCase()] || statusColors[currentStatusValue]) : undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <FolderLock className="h-4 w-4" /> Vinculação do Registro
              </h3>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input readOnly value={selectedCustomerName} className="flex-1 bg-muted/30" />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={onOpenCustomerSearch} disabled={isReadOnly || isSaving}>
                                {field.value ? 'Trocar' : 'Selecionar'} Cliente
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
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Produto" /></SelectTrigger></FormControl>
                        <SelectContent>{productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status Atual</FormLabel>
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Prazos e Informações da Esteira
              </h3>
              
              {/* LINHA 1: BENEFÍCIO, ÓRGÃO, BANCO DIGITADO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="selectedBenefitNumber"
                  render={({ field }) => (
                    <FormItem><FormLabel>Nº do Benefício</FormLabel>
                      {selectedCustomer && selectedCustomer.benefits && selectedCustomer.benefits.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                          <FormControl><SelectTrigger><SelectValue placeholder="NB" /></SelectTrigger></FormControl>
                          <SelectContent>{selectedCustomer.benefits.map(benefit => (
                              <SelectItem key={benefit.number} value={benefit.number}>{benefit.number}</SelectItem>
                            ))}</SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input placeholder="Sem benefícios" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} disabled={isReadOnly || !selectedCustomerId || isSaving}/></FormControl>
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
                            <FormControl><SelectTrigger><SelectValue placeholder="Órgão" /></SelectTrigger></FormControl>
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
                        <FormLabel>Banco Digitado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger></FormControl>
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

              {/* LINHA 2: BANCO PORTADO (ORIGEM), Nº PROPOSTA, TABELA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {productValue === 'Portabilidade' ? (
                    <FormField
                        control={form.control}
                        name="bankOrigin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banco Portado (Origem)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isReadOnly || isSaving}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger></FormControl>
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
                ) : <div />}
                
                <FormField
                  control={form.control}
                  name="proposalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Proposta</FormLabel>
                      <FormControl><Input placeholder="Número oficial" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving}/></FormControl>
                      <FormMessage />
                      {duplicateProposal && (
                        <Alert variant="destructive" className="mt-2 py-2 px-3 border-2 border-red-500 bg-red-50 animate-bounce"><AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-black uppercase">Proposta Duplicada!</AlertTitle>
                            <AlertDescription className="text-[10px] font-bold">Já pertence a <strong>{customers.find(c => c.id === duplicateProposal.customerId)?.name}</strong>.</AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem><FormLabel>Tabela</FormLabel><FormControl><Input placeholder="Nome da Tabela" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>

              {/* LINHA 3: DATAS DINÂMICAS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateDigitized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Digitação</FormLabel>
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
                                <FormLabel>Data Retorno Saldo</FormLabel>
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
                                <FormLabel>Data Averbação</FormLabel>
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
                                <FormLabel>Pgto. ao Cliente</FormLabel>
                                <FormControl><Input placeholder="dd/mm/aaaa" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(applyDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
              </div>

              {/* LINHA 4: OPERADOR E PROMOTORA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem><FormLabel>Operador</FormLabel><FormControl><Input placeholder="Nome do Agente" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} /></FormControl></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="promoter"
                  render={({ field }) => (
                    <FormItem><FormLabel>Promotora</FormLabel><FormControl><Input placeholder="Nome da Promotora" {...field} value={field.value ?? ''} readOnly={isReadOnly || isSaving} /></FormControl></FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Valores e Performance Financeira
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="term" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prazo</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="number" {...field} value={field.value ?? 84} readOnly={isReadOnly || isSaving} />
                                    <span className="absolute right-3 top-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Meses</span>
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="interestRate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa de Juros (%)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="number" step="0.01" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                    <span className="absolute right-3 top-2.5 text-[10px] font-black text-muted-foreground">%</span>
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Parcela</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="netAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Líquido (Cliente)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="grossAmount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bruto (Base)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="commissionBase" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Base do Cálculo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? 'gross'} disabled={isReadOnly || isSaving}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="gross">Sobre o Bruto</SelectItem>
                                    <SelectItem value="net">Sobre o Líquido</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="commissionPercentage" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (%)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="number" step="0.01" className="pr-8" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                    <span className="absolute right-3 top-2.5 text-[10px] font-black text-muted-foreground">%</span>
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="commissionValue" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (R$)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9 font-bold text-primary" {...field} value={field.value ?? 0} readOnly={isReadOnly || isSaving} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <History className="h-4 w-4" /> Linha do Tempo da Proposta
                </h3>
                {proposal?.id && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Nova atualização de trâmite..." value={newHistoryEntry} onChange={e => setNewHistoryEntry(e.target.value)} disabled={isAddingHistory} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddHistory())} />
                            <Button type="button" size="sm" onClick={handleAddHistory} disabled={isAddingHistory || !newHistoryEntry.trim()}>
                                {isAddingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {proposal.history && proposal.history.length > 0 ? (
                                [...proposal.history].sort((a,b) => b.date.localeCompare(a.date)).map(entry => (
                                    <div key={entry.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase text-primary/70">{entry.userName}</span>
                                            <span className="text-[9px] text-muted-foreground">{format(parseISO(entry.date), "dd/MM/yy HH:mm")}</span>
                                        </div>
                                        <p className="text-xs text-foreground flex items-start gap-2"><MessageSquareQuote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />{entry.message}</p>
                                    </div>
                                ))
                            ) : <div className="text-center py-8 opacity-20"><History className="mx-auto mb-2" /><p className="text-xs font-bold uppercase tracking-tighter">Nenhum trâmite registrado.</p></div>}
                        </div>
                    </div>
                )}
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <FolderLock className="h-4 w-4" /> Anexos e Digitalização
                </h3>
                {isAttachmentSectionDisabled ? (
                    <Alert className="bg-secondary">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Upload Bloqueado</AlertTitle>
                        <AlertDescription className='text-xs'>Salve a proposta pela primeira vez para liberar o upload de arquivos.</AlertDescription>
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
        <div className="flex justify-between items-center pt-8 print:hidden">
            <div className="flex items-center gap-2">
                {sheetMode !== 'new' && proposal && (
                    <>
                        <Button type="button" variant="outline" onClick={() => onDuplicate(proposal)} disabled={isSaving}><Copy /> Duplicar</Button>
                        <Button type="button" variant="outline" onClick={() => window.print()} disabled={isSaving}><Printer /> Imprimir</Button>
                        <Button type="button" variant="outline" onClick={handleExportCover} disabled={isSaving} className="bg-primary/5 border-primary/20 text-primary"><FileBadge className="mr-2 h-4 w-4" /> Capa PDF</Button>
                    </>
                )}
            </div>
            {!isReadOnly && (
                <Button type="submit" disabled={isSaving || !!duplicateProposal}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Proposta'}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
