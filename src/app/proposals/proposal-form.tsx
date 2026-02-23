'use client';

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
    Info, 
    Copy, 
    Printer, 
    Check, 
    Download, 
    FolderLock, 
    Loader2, 
    MessageSquareWarning, 
    History, 
    FileBadge,
    Calendar as CalendarIcon,
    AlertTriangle,
    MessageSquareQuote,
    Building2,
    Clock,
    UserCog
} from 'lucide-react';
import { format, parse, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency, cleanBankName } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, Attachment, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState, useMemo } from 'react';
import { ProposalAttachmentUploader } from '@/components/proposals/proposal-attachment-uploader';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  commissionValue: z.coerce.number().min(0, 'O valor da comissão é obrigatório.'),

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

const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
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

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
  });

  const { watch, setValue, trigger } = form;
  const commissionBase = watch('commissionBase');
  const commissionPercentage = watch('commissionPercentage');
  const grossAmount = watch('grossAmount');
  const netAmount = watch('netAmount');
  const product = watch('product');
  const selectedCustomerId = watch('customerId');
  const status = watch('status');
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
    return allProposals.find(p => p.proposalNumber === proposalNumberValue && p.id !== proposal?.id);
  }, [proposalNumberValue, allProposals, proposal]);

  useEffect(() => {
    if (selectedCustomerFromSearch) {
        setValue('customerId', selectedCustomerFromSearch.id, { shouldValidate: true });
        setValue('selectedBenefitNumber', '');
        trigger('customerId');
        onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, setValue, trigger, onCustomerSearchSelectionHandled]);

  useEffect(() => {
    const currentBenefit = form.getValues('selectedBenefitNumber');
    if (!selectedCustomerId) {
        form.setValue('selectedBenefitNumber', '');
        return;
    }
    const isBenefitValidForCustomer = selectedCustomer?.benefits?.some(b => b.number === currentBenefit);
    if (selectedCustomerId && !isBenefitValidForCustomer) {
      form.setValue('selectedBenefitNumber', '');
    }
  }, [selectedCustomerId, form, selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.benefits && selectedCustomer.benefits.length === 1) {
        form.setValue('selectedBenefitNumber', selectedCustomer.benefits[0].number);
    }
  }, [selectedCustomer, form]);

  useEffect(() => {
    if (isReadOnly) return;
    let baseValue = 0;
    if (commissionBase === 'gross') baseValue = grossAmount || 0;
    else if (commissionBase === 'net') baseValue = netAmount || 0;

    if (baseValue > 0 && commissionPercentage >= 0) {
        const calculatedCommission = baseValue * (commissionPercentage / 100);
        if (form.getValues('commissionValue') !== parseFloat(calculatedCommission.toFixed(2))) {
            setValue('commissionValue', parseFloat(calculatedCommission.toFixed(2)), { shouldValidate: true });
        }
    }
  }, [commissionBase, commissionPercentage, grossAmount, netAmount, setValue, isReadOnly, form]);

  useEffect(() => {
    if (isReadOnly) return;
    const today = format(new Date(), 'dd/MM/yyyy');
    if (status === 'Saldo Pago' && product === 'Portabilidade') {
        if (!form.getValues('debtBalanceArrivalDate')) setValue('debtBalanceArrivalDate', today, { shouldValidate: true });
    } else if (status === 'Pago') {
        if (!form.getValues('dateApproved')) setValue('dateApproved', today, { shouldValidate: true });
        if (!form.getValues('datePaidToClient')) setValue('datePaidToClient', today, { shouldValidate: true });
    }
  }, [status, product, setValue, isReadOnly, form]);

  const formatDateForForm = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
        if (dateString.includes('T')) {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'dd/MM/yyyy') : undefined;
        }
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return undefined;
    } catch { return undefined; }
  }

  useEffect(() => {
    const initialValues: Partial<ProposalFormValues> = {
        proposalNumber: '',
        customerId: '',
        product: '',
        status: 'Em Andamento',
        commissionStatus: undefined,
        selectedBenefitNumber: '',
        table: '',
        term: undefined,
        interestRate: undefined,
        grossAmount: undefined,
        netAmount: undefined,
        installmentAmount: undefined,
        commissionBase: 'gross',
        commissionPercentage: undefined,
        commissionValue: undefined,
        promoter: '',
        bank: '',
        bankOrigin: '',
        approvingBody: '',
        operator: '',
        dateDigitized: isClient ? format(new Date(), 'dd/MM/yyyy') : '',
        attachments: [],
        observations: '',
    };
    const source = proposal || defaultValues;
    if (source) {
        const sourceData = {
            ...initialValues,
            ...source,
            dateDigitized: source.dateDigitized ? formatDateForForm(source.dateDigitized) : (isClient ? format(new Date(), 'dd/MM/yyyy') : ''),
            dateApproved: formatDateForForm(source.dateApproved),
            datePaidToClient: formatDateForForm(source.datePaidToClient),
            debtBalanceArrivalDate: formatDateForForm(source.debtBalanceArrivalDate),
        }
        form.reset(sourceData);
    } else form.reset(initialValues);
  }, [proposal, defaultValues, form, isClient]);

  function handleFormSubmit(data: ProposalFormValues) {
    if (duplicateProposal) {
        toast({ variant: 'destructive', title: 'Proposta Duplicada', description: `O número ${data.proposalNumber} já existe.` });
        return;
    }

    // Converter datas de dd/MM/yyyy para ISO antes de salvar
    const convertToIso = (dateStr?: string) => {
        if (!dateStr) return undefined;
        try {
            const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
            return isValid(parsed) ? parsed.toISOString() : undefined;
        } catch { return undefined; }
    }

    const finalData = {
        ...data,
        dateDigitized: convertToIso(data.dateDigitized) || new Date().toISOString(),
        dateApproved: convertToIso(data.dateApproved),
        datePaidToClient: convertToIso(data.datePaidToClient),
        debtBalanceArrivalDate: convertToIso(data.debtBalanceArrivalDate),
    };

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
    const updateData = {
        history: arrayUnion(entry),
        statusUpdatedAt: now 
    };

    updateDoc(docRef, updateData)
        .then(() => {
            setNewHistoryEntry('');
            toast({ title: "Histórico Atualizado", description: "O trâmite foi registrado e o cronômetro de ociosidade foi reiniciado." });
        })
        .catch(async (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            }
            toast({ variant: "destructive", title: "Erro ao registrar" });
        })
        .finally(() => setIsAddingHistory(false));
  };

  const handleExportCover = async () => {
    if (!proposal || !selectedCustomer) {
        toast({ variant: "destructive", title: "Dados insuficientes" });
        return;
    }
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const primaryColor = [30, 58, 138];
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CAPA DE PROPOSTA", 105, 25, { align: 'center' });
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DADOS DO CLIENTE", 14, 45);
    autoTable(doc, {
        startY: 48,
        body: [
            ['Nome Completo', selectedCustomer.name],
            ['CPF', selectedCustomer.cpf],
            ['Nº do Benefício', form.getValues('selectedBenefitNumber') || '-'],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });
    doc.text("DADOS DA OPERAÇÃO", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        body: [
            ['Número da Proposta', form.getValues('proposalNumber')],
            ['Produto', form.getValues('product')],
            ['Banco Digitado', form.getValues('bank')],
            ['Status', form.getValues('status')],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });
    doc.save(`Capa_${form.getValues('proposalNumber')}.pdf`);
  };

  const isAttachmentSectionDisabled = !user || !selectedCustomerId || !currentProposalId;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          <div className="space-y-8">
            {/* SEÇÃO 1: VINCULAÇÃO */}
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
              {selectedCustomer && selectedCustomer.documents && selectedCustomer.documents.length > 0 && (
                <Alert className="bg-primary/5 border-primary/20">
                    <FolderLock className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-bold text-primary">Documentos Permanentes Disponíveis</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-wrap gap-2">
                        {selectedCustomer.documents.map((doc, i) => (
                            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-background border rounded text-[10px] font-medium hover:bg-accent flex items-center gap-1">
                                <Download className="h-2.5 w-2.5" />{doc.name}
                            </a>
                        ))}
                    </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Status" /></SelectTrigger></FormControl>
                        <SelectContent>{proposalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}
                />
              </div>
            </div>

            <Separator />

            {/* SEÇÃO 2: DETALHES E PRAZOS (CONTEÚDO RESTAURADO) */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Prazos e Informações da Esteira
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="proposalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Proposta</FormLabel>
                      <FormControl><Input placeholder="Número oficial" {...field} readOnly={(isReadOnly && sheetMode === 'edit') || isSaving} value={field.value || ''}/></FormControl>
                      <FormMessage />
                      {duplicateProposal && (
                        <Alert variant="destructive" className="mt-2 py-2 px-3 border-2"><AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold uppercase">Proposta Duplicada!</AlertTitle>
                            <AlertDescription className="text-[10px] font-medium">Já pertence a <strong>{customers.find(c => c.id === duplicateProposal.customerId)?.name}</strong>.</AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem><FormLabel>Tabela</FormLabel><FormControl><Input placeholder="Nome da Tabela" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="selectedBenefitNumber"
                  render={({ field }) => (
                    <FormItem><FormLabel>Nº do Benefício</FormLabel>
                      {selectedCustomer && selectedCustomer.benefits && selectedCustomer.benefits.length > 0 ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''} disabled={isReadOnly || isSaving}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione um benefício..." /></SelectTrigger></FormControl>
                          <SelectContent>{selectedCustomer.benefits.map(benefit => (
                              <SelectItem key={benefit.number} value={benefit.number}><span className="font-medium">{benefit.number}</span></SelectItem>
                            ))}</SelectContent>
                        </Select>
                      ) : (
                        <FormControl><Input placeholder="Digitação manual" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} disabled={isReadOnly || !selectedCustomerId || isSaving}/></FormControl>
                      )}<FormMessage /></FormItem>
                  )}
                />
              </div>

              {/* GRID DE DATAS RESTAURADO */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="dateDigitized"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Digitação</FormLabel>
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} onChange={(e) => field.onChange(handleDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} /></FormControl>
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
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} onChange={(e) => field.onChange(handleDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl>
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
                      <FormControl><Input placeholder="dd/mm/aaaa" {...field} onChange={(e) => field.onChange(handleDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {product === 'Portabilidade' && (
                    <FormField
                        control={form.control}
                        name="debtBalanceArrivalDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Chegada Saldo</FormLabel>
                            <FormControl><Input placeholder="dd/mm/aaaa" {...field} onChange={(e) => field.onChange(handleDateMask(e))} maxLength={10} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
              </div>

              {/* OPERACIONAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="promoter"
                  render={({ field }) => (
                    <FormItem><FormLabel>Promotora</FormLabel><FormControl><Input placeholder="Promotora" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem><FormLabel>Banco Digitado</FormLabel><FormControl><Input placeholder="Banco" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvingBody"
                  render={({ field }) => (
                    <FormItem><FormLabel>Órgão</FormLabel><FormControl><Input placeholder="Ex: INSS" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem><FormLabel>Operador</FormLabel><FormControl><Input placeholder="Nome do Agente" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* SEÇÃO 3: VALORES E COMISSÃO */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Valores e Performance Financeira
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                        <FormItem><FormLabel>Valor Parcela</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="netAmount" render={({ field }) => (
                        <FormItem><FormLabel>Líquido (Cliente)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                     <FormField control={form.control} name="grossAmount" render={({ field }) => (
                        <FormItem><FormLabel>Bruto (Base)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="commissionBase" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Base do Cálculo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || isSaving}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="gross">Sobre o Bruto</SelectItem>
                                    <SelectItem value="net">Sobre o Líquido</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="commissionPercentage" render={({ field }) => (
                        <FormItem><FormLabel>Comissão (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="commissionValue" render={({ field }) => (
                        <FormItem><FormLabel>Comissão (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} /></FormControl></FormItem>
                    )} />
                </div>
            </div>

            <Separator />

            {/* SEÇÃO 4: HISTÓRICO */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <History className="h-4 w-4" /> Linha do Tempo da Proposta
                </h3>
                {proposal?.id && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Registrar nova atualização de trâmite..." value={newHistoryEntry} onChange={e => setNewHistoryEntry(e.target.value)} disabled={isAddingHistory} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddHistory())} />
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

            {/* SEÇÃO 5: ANEXOS */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
                    <FolderLock className="h-4 w-4" /> Anexos e Digitalização
                </h3>
                {isAttachmentSectionDisabled ? <Alert className="bg-secondary"><Info className="h-4 w-4" /><AlertTitle>Upload Bloqueado</AlertTitle></Alert> : (
                    <ProposalAttachmentUploader userId={user!.uid} proposalId={currentProposalId!} initialAttachments={form.getValues('attachments') || []} onAttachmentsChange={handleAttachmentsChange} isReadOnly={isReadOnly || isSaving} />
                )}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-8 print:hidden">
            <div className="flex items-center gap-2">{sheetMode !== 'new' && proposal && (<><Button type="button" variant="outline" onClick={() => onDuplicate(proposal)} disabled={isSaving}><Copy /> Duplicar</Button><Button type="button" variant="outline" onClick={() => window.print()} disabled={isSaving}><Printer /> Imprimir</Button><Button type="button" variant="outline" onClick={handleExportCover} disabled={isSaving} className="bg-primary/5 border-primary/20 text-primary"><FileBadge className="mr-2 h-4 w-4" /> Capa PDF</Button></>)}</div>
            {!isReadOnly && <Button type="submit" disabled={isSaving || !!duplicateProposal}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Proposta'}</Button>}
        </div>
      </form>
    </Form>
  );
}
