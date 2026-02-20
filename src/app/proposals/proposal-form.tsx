
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
    ChevronsUpDown, 
    Check, 
    Download, 
    FolderLock, 
    Loader2, 
    MessageSquareWarning, 
    History, 
    Send, 
    MessageSquareQuote,
    FileBadge,
    Calendar as CalendarIcon,
    AlertTriangle
} from 'lucide-react';
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency, cleanBankName } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, Attachment, UserSettings, ProposalHistoryEntry } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState, useMemo } from 'react';
import { ProposalAttachmentUploader } from '@/components/proposals/proposal-attachment-uploader';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { toast } from '@/hooks/use-toast';
import { BankIcon } from '@/components/bank-icon';

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


const MaskedDatePicker = ({ name, label, control, isReadOnly }: { name: any, label: string, control: any, isReadOnly?: boolean }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-col pt-2">
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="dd/mm/aaaa"
                            {...field}
                            onChange={(e) => field.onChange(handleDateMask(e))}
                            value={field.value || ''}
                            maxLength={10}
                            className="flex h-10 w-[240px] rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);


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
        // 🛡️ RESET ATÔMICO DE BENEFÍCIO: Limpa valor anterior imediatamente ao trocar cliente
        setValue('selectedBenefitNumber', '');
        trigger('customerId');
        onCustomerSearchSelectionHandled();
    }
  }, [selectedCustomerFromSearch, setValue, trigger, onCustomerSearchSelectionHandled]);


  // 🛡️ REFINAMENTO DE SINCRONIZAÇÃO: Limpa benefício se o cliente mudar
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
    if (commissionBase === 'gross') {
        baseValue = grossAmount || 0;
    } else if (commissionBase === 'net') {
        baseValue = netAmount || 0;
    }

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
    const isPortability = product === 'Portabilidade';
    
    if (status === 'Saldo Pago' && isPortability) {
        if (!form.getValues('debtBalanceArrivalDate')) {
            setValue('debtBalanceArrivalDate', today, { shouldValidate: true });
        }
    } else if (status === 'Pago') {
        if (!form.getValues('dateApproved')) {
            setValue('dateApproved', today, { shouldValidate: true });
        }
        if (!form.getValues('datePaidToClient')) {
            setValue('datePaidToClient', today, { shouldValidate: true });
        }
    }
  }, [status, product, setValue, isReadOnly, form]);

  const formatDateForForm = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return undefined;
        return format(date, 'dd/MM/yyyy');
    } catch {
        return undefined;
    }
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
        dateApproved: undefined,
        datePaidToClient: undefined,
        debtBalanceArrivalDate: undefined,
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
            bank: source.bank || '',
            bankOrigin: source.bankOrigin || '',
        }
        form.reset(sourceData);
    } else {
      form.reset(initialValues);
    }
  }, [proposal, defaultValues, form, isClient]);

  function handleFormSubmit(data: ProposalFormValues) {
    if (duplicateProposal) {
        toast({
            variant: 'destructive',
            title: 'Proposta Duplicada',
            description: `O número ${data.proposalNumber} já existe no sistema.`,
        });
        return;
    }
    onSubmit(data);
  }

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setValue('attachments', attachments, { shouldValidate: true });
  };

  const handleAddHistory = async () => {
    if (!newHistoryEntry.trim() || !proposal?.id || !firestore) return;
    
    setIsAddingHistory(true);
    const entry: ProposalHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        message: newHistoryEntry.trim(),
        userName: user?.displayName || user?.email || 'Usuário'
    };

    try {
        await updateDoc(doc(firestore, 'loanProposals', proposal.id), {
            history: arrayUnion(entry)
        });
        setNewHistoryEntry('');
        toast({ title: "Histórico Atualizado", description: "O trâmite foi registrado com sucesso." });
    } catch (e) {
        console.error("Error adding history:", e);
        toast({ variant: "destructive", title: "Erro ao registrar", description: "Tente novamente." });
    } finally {
        setIsAddingHistory(false);
    }
  };

  const handleExportCover = async () => {
    if (!proposal || !selectedCustomer) {
        toast({ 
            variant: "destructive", 
            title: "Dados insuficientes", 
            description: "Selecione um cliente e salve a proposta antes de gerar a capa." 
        });
        return;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const primaryColor = [30, 58, 138];

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
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
            ['Data de Nascimento', format(parse(selectedCustomer.birthDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')],
            ['Telefone Principal', selectedCustomer.phone],
            ['Nº do Benefício', form.getValues('selectedBenefitNumber') || '-'],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DADOS DA OPERAÇÃO", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        body: [
            ['Número da Proposta', form.getValues('proposalNumber')],
            ['Produto', form.getValues('product')],
            ['Banco Digitado', form.getValues('bank')],
            ['Tabela / Convênio', form.getValues('table')],
            ['Prazo (Meses)', `${form.getValues('term')}x`],
            ['Operador Responsável', form.getValues('operator')],
            ['Status da Proposta', form.getValues('status')],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VALORES E COMISSÃO", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 18,
        head: [['Discriminação', 'Valor']],
        body: [
            ['Valor Bruto do Contrato', formatCurrency(Number(form.getValues('grossAmount')))],
            ['Valor Líquido Liberado', formatCurrency(Number(form.getValues('netAmount')))],
            ['Valor da Parcela Mensal', formatCurrency(Number(form.getValues('installmentAmount')))],
            ['Comissão Prevista (R$)', formatCurrency(Number(form.getValues('commissionValue')))],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 11, cellPadding: 3 }
    });

    const obs = form.getValues('observations');
    if (obs) {
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("OBSERVAÇÕES ADICIONAIS", 14, (doc as any).lastAutoTable.finalY + 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        const splitObs = doc.splitTextToSize(obs, 180);
        doc.text(splitObs, 14, (doc as any).lastAutoTable.finalY + 22);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(150);
    doc.line(40, pageHeight - 40, 170, pageHeight - 40);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Assinatura do Operador", 105, pageHeight - 35, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Documento gerado pelo sistema LK RAMOS em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, pageHeight - 10, { align: 'center' });

    doc.save(`Capa_Proposta_${form.getValues('proposalNumber')}_${selectedCustomer.name.split(' ')[0]}.pdf`);
    toast({ title: "Capa Gerada!", description: "O documento PDF foi baixado com sucesso." });
  };

  const isAttachmentSectionDisabled = !user || !selectedCustomerId || !currentProposalId;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <div className="hidden print:block mb-8">
          <Logo forPrinting={true} />
          <h1 className="text-2xl font-bold mt-4">Detalhes da Proposta</h1>
        </div>
        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          <div className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input
                                    readOnly
                                    value={selectedCustomerName}
                                    className="flex-1 bg-muted/30"
                                />
                            </FormControl>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onOpenCustomerSearch}
                                disabled={isReadOnly || isSaving}
                            >
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
                    <AlertTitle className="text-xs font-bold text-primary flex items-center gap-2">
                        Documentos Permanentes Disponíveis
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <div className="flex flex-wrap gap-2">
                            {selectedCustomer.documents.map((doc, i) => (
                                <a 
                                    key={i} 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2 py-1 bg-background border rounded text-[10px] font-medium hover:bg-accent transition-colors"
                                >
                                    <Download className="h-2.5 w-2.5" />
                                    {doc.name}
                                </a>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                            {type}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
              />
            </div>
            
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalhes da Proposta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proposalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Proposta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o número da proposta"
                          {...field}
                          readOnly={(isReadOnly && sheetMode === 'edit') || isSaving}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                      {duplicateProposal && (
                        <Alert variant="destructive" className="mt-2 py-2 px-3 border-2 animate-in slide-in-from-top-1">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold uppercase">Proposta Duplicada!</AlertTitle>
                            <AlertDescription className="text-[10px] font-medium leading-tight">
                                Este número já pertence à proposta de <strong>{customers.find(c => c.id === duplicateProposal.customerId)?.name || 'Outro Cliente'}</strong>.
                            </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="table"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tabela</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tabela A"
                          {...field}
                          readOnly={isReadOnly || isSaving}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="selectedBenefitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº do Benefício</FormLabel>
                      {selectedCustomer && selectedCustomer.benefits && selectedCustomer.benefits.length > 0 ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''} disabled={isReadOnly || isSaving}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um benefício..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedCustomer.benefits.map((benefit) => (
                              <SelectItem key={benefit.number} value={benefit.number}>
                                <span className="font-medium">{benefit.number}</span>
                                {benefit.species && <span className="text-muted-foreground ml-2">{benefit.species}</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input
                            placeholder={selectedCustomerId ? "Benefício não cadastrado (digitação manual)" : "Selecione um cliente"}
                            {...field}
                            readOnly={isReadOnly || isSaving}
                            value={field.value || ''}
                            disabled={isReadOnly || !selectedCustomerId || isSaving}
                          />
                        </FormControl>
                      )}
                       <FormDescription>
                        {selectedCustomer && (!selectedCustomer.benefits || selectedCustomer.benefits.length === 0)
                          ? "Este cliente não tem benefícios cadastrados. Você pode digitá-lo manualmente ou adicioná-lo na tela de Clientes."
                          : "Selecione o benefício que será usado para esta proposta."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo (meses)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="84"
                          {...field}
                          readOnly={isReadOnly || isSaving}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Juros (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.8"
                          {...field}
                          readOnly={isReadOnly || isSaving}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="installmentAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Parcela</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="450.50" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="netAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Líquido</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="25000" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="grossAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Bruto</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="30000" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Comissão</h3>
                 <FormField
                    control={form.control}
                    name="commissionBase"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Base da Comissão</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex items-center space-x-4"
                            disabled={isReadOnly || isSaving}
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="gross" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                Valor Bruto
                                </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="net" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                Valor Líquido
                                </FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="commissionPercentage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (%)</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="5" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commissionValue"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comissão (R$)</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="1500" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <Separator />

             <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Bancários e Operacionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="bank"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Banco Digitado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um banco" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        <div className="flex items-center gap-2">
                                            <BankIcon 
                                                bankName={bank} 
                                                domain={userSettings?.bankDomains?.[bank]} 
                                                showLogo={showLogos} 
                                            />
                                            <span>{cleanBankName(bank)}</span>
                                        </div>
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {product === 'Portabilidade' && (
                        <FormField
                            control={form.control}
                            name="bankOrigin"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banco de Origem</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''} disabled={isReadOnly || isSaving}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um banco" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        <div className="flex items-center gap-2">
                                            <BankIcon 
                                                bankName={bank} 
                                                domain={userSettings?.bankDomains?.[bank]} 
                                                showLogo={showLogos} 
                                            />
                                            <span>{cleanBankName(bank)}</span>
                                        </div>
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="promoter"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Promotora</FormLabel>
                            <FormControl>
                            <Input placeholder="Promotora X" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="operator"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Operador</FormLabel>
                            <FormControl>
                            <Input placeholder="Nome do Operador" {...field} readOnly={isReadOnly || isSaving} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
             </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Finalização e Datas</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status da Proposta</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {proposalStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="approvingBody"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Órgão Aprovador</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly || isSaving}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione o órgão" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {approvingBodies.map((body) => (
                                    <SelectItem key={body} value={body}>
                                        {body}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <MaskedDatePicker name="dateDigitized" label="Data de Digitação" control={form.control} isReadOnly={isReadOnly || isSaving} />
                    {product === 'Portabilidade' ? (
                        <>
                            <MaskedDatePicker name="debtBalanceArrivalDate" label="Chegada Saldo Devedor" control={form.control} isReadOnly={isReadOnly || isSaving} />
                            <MaskedDatePicker name="dateApproved" label="Data de Averbação" control={form.control} isReadOnly={isReadOnly || isSaving} />
                        </>
                    ) : (product === 'Refin Port') ? (
                        <>
                            <MaskedDatePicker name="dateApproved" label="Data de Averbação" control={form.control} isReadOnly={isReadOnly || isSaving} />
                            <MaskedDatePicker name="datePaidToClient" label="Data de Pagamento ao Cliente" control={form.control} isReadOnly={isReadOnly || isSaving} />
                        </>
                    ) : (
                        <>
                            <MaskedDatePicker name="dateApproved" label="Data de Averbação" control={form.control} isReadOnly={isReadOnly || isSaving} />
                            <MaskedDatePicker name="datePaidToClient" label="Data de Pagamento ao Cliente" control={form.control} isReadOnly={isReadOnly || isSaving} />
                        </>
                    )}
                 </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Histórico de Trâmites
                    </h3>
                    <Badge variant="secondary" className="text-[10px] uppercase">Logs Operacionais</Badge>
                </div>
                
                {proposal?.id && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Registrar novo trâmite ou atualização..." 
                                value={newHistoryEntry}
                                onChange={(e) => setNewHistoryEntry(e.target.value)}
                                disabled={isAddingHistory}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHistory())}
                            />
                            <Button type="button" size="sm" onClick={handleAddHistory} disabled={isAddingHistory || !newHistoryEntry.trim()}>
                                {isAddingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {proposal.history && proposal.history.length > 0 ? (
                                [...proposal.history].sort((a,b) => b.date.localeCompare(a.date)).map((entry) => (
                                    <div key={entry.id} className="p-3 bg-muted/30 rounded-lg border border-border/50 relative group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-black uppercase text-primary/70">{entry.userName}</span>
                                            <span className="text-[9px] text-muted-foreground">{format(parseISO(entry.date), "dd/MM/yyyy HH:mm")}</span>
                                        </div>
                                        <p className="text-xs text-foreground leading-relaxed flex items-start gap-2">
                                            <MessageSquareQuote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                                            {entry.message}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/5">
                                    <History className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                    <p className="text-xs text-muted-foreground">Nenhum trâmite registrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {!proposal?.id && (
                    <p className="text-xs text-muted-foreground italic">Salve a proposta primeiro para registrar o histórico de trâmites.</p>
                )}
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{product === 'Portabilidade' ? 'Motivo da Reprova / Observações' : 'Observações'}</h3>
                    {product === 'Portabilidade' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 uppercase tracking-tight">
                            <MessageSquareWarning className="h-3 w-3" />
                            Campo Essencial para Cancelamentos
                        </div>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder={product === 'Portabilidade' ? "Descreva o motivo do cancelamento ou da reprova da portabilidade..." : "Observações gerais sobre a proposta..."}
                                    className="min-h-[100px] resize-none"
                                    {...field}
                                    value={field.value || ''}
                                    readOnly={isReadOnly || isSaving}
                                />
                            </FormControl>
                            <FormDescription>
                                {product === 'Portabilidade' 
                                    ? "Importante: Em caso de cancelamento, detalhe aqui o motivo fornecido pelo banco ou promotora."
                                    : "Informações adicionais relevantes para o acompanhamento desta proposta."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Anexos da Proposta</h3>
                {isAttachmentSectionDisabled ? (
                    <Alert variant="default" className="bg-secondary">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Upload Bloqueado</AlertTitle>
                        <AlertDescription>
                            Selecione um cliente para habilitar o envio de documentos.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <ProposalAttachmentUploader
                        userId={user!.uid}
                        proposalId={currentProposalId!}
                        initialAttachments={form.getValues('attachments') || []}
                        onAttachmentsChange={handleAttachmentsChange}
                        isReadOnly={isReadOnly || isAttachmentSectionDisabled || isSaving}
                    />
                )}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-8 print:hidden">
            <div className="flex items-center gap-2">
                {sheetMode !== 'new' && proposal && (
                    <>
                        <Button type="button" variant="outline" onClick={() => onDuplicate(proposal)} disabled={isSaving}>
                            <Copy /> Duplicar Proposta
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.print()} disabled={isSaving}>
                            <Printer /> Imprimir
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleExportCover} 
                            disabled={isSaving}
                            className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                        >
                            <FileBadge className="mr-2 h-4 w-4" /> Capa de Proposta (PDF)
                        </Button>
                    </>
                )}
            </div>

            {!isReadOnly && (
                <Button type="submit" disabled={isSaving || !!duplicateProposal}>
                    {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                        'Salvar Proposta'
                    )}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
