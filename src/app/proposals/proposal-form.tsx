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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, Copy, Printer, ChevronsUpDown, Check } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import * as configData from '@/lib/config-data';
import type { Proposal, Customer, Attachment, UserSettings } from '@/lib/types';
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
import { useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore'; // Only for ID generation
import { useFirestore } from '@/firebase';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


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
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

type ProposalFormData = Partial<Omit<Proposal, 'id' | 'ownerId'>>;

interface ProposalFormProps {
  proposal?: Proposal;
  customers: Customer[];
  userSettings: UserSettings | null;
  isReadOnly?: boolean;
  onSubmit: (data: ProposalFormValues) => void;
  onDuplicate: (proposal: Proposal) => void;
  defaultValues?: ProposalFormData;
  sheetMode: 'new' | 'edit' | 'view';
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
                        <Input
                            placeholder="dd/mm/aaaa"
                            {...field}
                            onChange={(e) => field.onChange(handleDateMask(e))}
                            value={field.value || ''}
                            maxLength={10}
                            className="w-[240px]"
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);


export function ProposalForm({ proposal, customers, userSettings, isReadOnly, onSubmit, onDuplicate, defaultValues, sheetMode }: ProposalFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [tempProposalId, setTempProposalId] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [openCustomerSelector, setOpenCustomerSelector] = useState(false);

  const productTypes = userSettings?.productTypes || configData.productTypes;
  const proposalStatuses = userSettings?.proposalStatuses || configData.proposalStatuses;
  const approvingBodies = userSettings?.approvingBodies || configData.approvingBodies;
  const banks = userSettings?.banks || configData.banks;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (firestore && !proposal?.id) {
      setTempProposalId(doc(collection(firestore, 'proposals')).id);
    }
  }, [firestore, proposal]);
  
  const proposalId = proposal?.id || tempProposalId;

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

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    const currentBenefit = form.getValues('selectedBenefitNumber');
    const isBenefitValidForCustomer = selectedCustomer?.benefits?.some(b => b.number === currentBenefit);

    if (selectedCustomerId && !isBenefitValidForCustomer) {
      form.setValue('selectedBenefitNumber', '');
    }
  }, [selectedCustomerId, form, selectedCustomer]);

  // Auto-select benefit if customer has only one
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
    } else {
      form.reset(initialValues);
    }
  }, [proposal, defaultValues, form, isClient]);

  function handleFormSubmit(data: ProposalFormValues) {
    onSubmit(data);
  }

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setValue('attachments', attachments, { shouldValidate: true });
  };

  const isAttachmentSectionDisabled = !user || !selectedCustomerId || !proposalId;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <Logo forPrinting={true} />
          <h1 className="text-2xl font-bold mt-4">Detalhes da Proposta</h1>
        </div>
        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          <div className="space-y-6">
            
            {/* Customer and Product */}
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Cliente</FormLabel>
                        <Popover open={openCustomerSelector} onOpenChange={setOpenCustomerSelector}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        disabled={isReadOnly}
                                    >
                                    {field.value
                                        ? customers.find(
                                            (customer) => customer.id === field.value
                                        )?.name
                                        : "Selecione um cliente"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Pesquisar cliente por nome ou CPF..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {customers.map((customer) => (
                                            <CommandItem
                                                key={customer.id}
                                                value={`${customer.name} ${customer.cpf}`}
                                                onSelect={() => {
                                                    form.setValue("customerId", customer.id);
                                                    setOpenCustomerSelector(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === customer.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div>
                                                    <p>{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.cpf}</p>
                                                </div>
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
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

            {/* Proposal Details */}
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
                          readOnly={isReadOnly && sheetMode === 'edit'}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
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
                          readOnly={isReadOnly}
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
                      <FormControl>
                        <Input
                          placeholder="Digite o número do benefício para esta proposta"
                          {...field}
                          readOnly={isReadOnly}
                          value={field.value || ''}
                        />
                      </FormControl>
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
                          readOnly={isReadOnly}
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
                          readOnly={isReadOnly}
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
            
            {/* Amounts */}
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
                            <Input type="number" step="0.01" placeholder="450.50" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                            <Input type="number" step="0.01" placeholder="25000" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                            <Input type="number" step="0.01" placeholder="30000" {...field} readOnly={isReadOnly} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <Separator />
            
            {/* Commission */}
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
                            disabled={isReadOnly}
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
                            <Input type="number" step="0.01" placeholder="5" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                            <Input type="number" step="0.01" placeholder="1500" {...field} readOnly={isReadOnly} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <Separator />

            {/* Banks and Operator */}
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Bancários e Operacionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="bank"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Banco Digitado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione um banco" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        {bank}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {(product === 'Portabilidade' || product === 'Refin Port') && (
                        <FormField
                            control={form.control}
                            name="bankOrigin"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banco de Origem</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''} disabled={isReadOnly}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione um banco" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks.map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        {bank}
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
                            <Input placeholder="Promotora X" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                            <Input placeholder="Nome do Operador" {...field} readOnly={isReadOnly} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
             </div>

            <Separator />
            
            {/* Status and Finalization */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Finalização e Datas</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status da Proposta</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
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
                    <MaskedDatePicker name="dateDigitized" label="Data de Digitação" control={form.control} isReadOnly={isReadOnly} />
                    <MaskedDatePicker name="dateApproved" label="Data de Averbação" control={form.control} isReadOnly={isReadOnly} />
                    <MaskedDatePicker name="datePaidToClient" label="Data de Pagamento ao Cliente" control={form.control} isReadOnly={isReadOnly} />
                    {product === 'Portabilidade' && (
                        <MaskedDatePicker name="debtBalanceArrivalDate" label="Chegada Saldo Devedor" control={form.control} isReadOnly={isReadOnly} />
                    )}
                 </div>
            </div>

            <Separator />

            {/* Attachments */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Anexos da Proposta</h3>
                {isAttachmentSectionDisabled ? (
                    <Alert variant="default" className="bg-secondary">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Campo Desabilitado</AlertTitle>
                        <AlertDescription>
                            Selecione um cliente para habilitar os anexos.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <ProposalAttachmentUploader
                        userId={user!.uid}
                        proposalId={proposalId!}
                        initialAttachments={form.getValues('attachments') || []}
                        onAttachmentsChange={handleAttachmentsChange}
                        isReadOnly={isReadOnly || isAttachmentSectionDisabled}
                    />
                )}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-8 print:hidden">
            <div className="flex items-center gap-2">
                {sheetMode !== 'new' && proposal && (
                    <>
                        <Button type="button" variant="outline" onClick={() => onDuplicate(proposal)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar Proposta
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                    </>
                )}
            </div>

            {!isReadOnly && (
                <Button type="submit">Salvar Proposta</Button>
            )}
        </div>
      </form>
    </Form>
  );
}
