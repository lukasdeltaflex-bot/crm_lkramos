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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { productTypes, proposalStatuses, approvingBodies, banks } from '@/lib/config-data';
import type { Proposal, Customer, Attachment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useMemo, useState } from 'react';
import { ProposalAttachmentUploader } from '@/components/proposals/proposal-attachment-uploader';
import { useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore'; // Only for ID generation
import { useFirestore } from '@/firebase';

const attachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
});

const proposalSchema = z.object({
  customerId: z.string({ required_error: 'Selecione um cliente.' }),
  product: z.string({ required_error: 'Selecione um produto.' }),
  status: z.string({ required_error: 'Selecione um status.' }),

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

  dateDigitized: z.date({ required_error: 'A data de digitação é obrigatória.' }),
  dateApproved: z.date().optional(),
  datePaidToClient: z.date().optional(),
  debtBalanceArrivalDate: z.date().optional(),
  
  attachments: z.array(attachmentSchema).optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  proposal?: Proposal;
  customers: Customer[];
  isReadOnly?: boolean;
  onSubmit: (data: ProposalFormValues) => void;
}

const DatePickerField = ({ name, label, control, isReadOnly }: { name: any, label: string, control: any, isReadOnly?: boolean }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
        <FormItem className="flex flex-col pt-2">
            <FormLabel>{label}</FormLabel>
            <Popover>
            <PopoverTrigger asChild>
                <FormControl>
                <Button
                    variant={'outline'}
                    className={cn(
                    'w-[240px] pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                    )}
                    disabled={isReadOnly}
                >
                    {field.value ? (
                    format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                    <span>Escolha uma data</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                defaultMonth={field.value || new Date()}
                locale={ptBR}
                initialFocus
                fromYear={new Date().getFullYear() - 20}
                toYear={new Date().getFullYear() + 20}
                captionLayout="dropdown-buttons"
                />
            </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
        )}
    />
);

export function ProposalForm({ proposal, customers, isReadOnly, onSubmit }: ProposalFormProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [tempProposalId] = useState(() => doc(collection(firestore, 'proposals')).id);
    const proposalId = proposal?.id || tempProposalId;

    const form = useForm<ProposalFormValues>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            customerId: proposal?.customerId || '',
            product: proposal?.product || '',
            status: proposal?.status || 'Em Andamento',
            table: proposal?.table || '',
            term: proposal?.term || undefined,
            interestRate: proposal?.interestRate || undefined,
            grossAmount: proposal?.grossAmount || undefined,
            netAmount: proposal?.netAmount || undefined,
            installmentAmount: proposal?.installmentAmount || undefined,
            commissionBase: proposal?.commissionBase || 'gross',
            commissionPercentage: proposal?.commissionPercentage || undefined,
            commissionValue: proposal?.commissionValue || undefined,
            promoter: proposal?.promoter || '',
            bank: proposal?.bank || '',
            bankOrigin: proposal?.bankOrigin || '',
            approvingBody: proposal?.approvingBody || '',
            operator: proposal?.operator || '',
            dateDigitized: proposal?.dateDigitized ? new Date(proposal.dateDigitized) : new Date(),
            dateApproved: proposal?.dateApproved ? new Date(proposal.dateApproved) : undefined,
            datePaidToClient: proposal?.datePaidToClient ? new Date(proposal.datePaidToClient) : undefined,
            debtBalanceArrivalDate: proposal?.debtBalanceArrivalDate ? new Date(proposal.debtBalanceArrivalDate) : undefined,
            attachments: proposal?.attachments || [],
        },
    });

  const { watch, setValue, trigger } = form;
  const commissionBase = watch('commissionBase');
  const commissionPercentage = watch('commissionPercentage');
  const grossAmount = watch('grossAmount');
  const netAmount = watch('netAmount');
  const product = watch('product');
  const selectedCustomerId = watch('customerId');

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
    const defaultValues: Partial<ProposalFormValues> = {
        customerId: '',
        product: '',
        status: 'Em Andamento',
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
        dateDigitized: new Date(),
        dateApproved: undefined,
        datePaidToClient: undefined,
        debtBalanceArrivalDate: undefined,
        attachments: [],
    };

    if (proposal) {
      form.reset({
        ...defaultValues,
        ...proposal,
        term: proposal.term || undefined,
        interestRate: proposal.interestRate || undefined,
        grossAmount: proposal.grossAmount || undefined,
        netAmount: proposal.netAmount || undefined,
        installmentAmount: proposal.installmentAmount || undefined,
        commissionPercentage: proposal.commissionPercentage || undefined,
        commissionValue: proposal.commissionValue || undefined,
        bankOrigin: proposal.bankOrigin || '',
        dateDigitized: proposal.dateDigitized ? new Date(proposal.dateDigitized) : new Date(),
        dateApproved: proposal.dateApproved ? new Date(proposal.dateApproved) : undefined,
        datePaidToClient: proposal.datePaidToClient ? new Date(proposal.datePaidToClient) : undefined,
        debtBalanceArrivalDate: proposal.debtBalanceArrivalDate ? new Date(proposal.debtBalanceArrivalDate) : undefined,
        attachments: proposal.attachments || [],
      });
    } else {
      form.reset(defaultValues);
    }
  }, [proposal, form]);


  function handleFormSubmit(data: ProposalFormValues) {
    onSubmit(data);
  }

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setValue('attachments', attachments, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="py-4">
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6">
            
            {/* Customer and Product */}
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="table"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tabela</FormLabel>
                            <FormControl>
                            <Input placeholder="Tabela A" {...field} readOnly={isReadOnly} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="term"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prazo (meses)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="84" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                            <Input type="number" step="0.01" placeholder="1.8" {...field} readOnly={isReadOnly} value={field.value || ''} />
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
                    <DatePickerField name="dateDigitized" label="Data de Digitação" control={form.control} isReadOnly={isReadOnly} />
                    <DatePickerField name="dateApproved" label="Data de Averbação" control={form.control} isReadOnly={isReadOnly} />
                    <DatePickerField name="datePaidToClient" label="Data de Pagamento ao Cliente" control={form.control} isReadOnly={isReadOnly} />
                    {(product === 'Portabilidade' || product === 'Refin Port') && (
                        <DatePickerField name="debtBalanceArrivalDate" label="Chegada Saldo Devedor" control={form.control} isReadOnly={isReadOnly} />
                    )}
                 </div>
            </div>

            <Separator />

            {/* Attachments */}
            {user && selectedCustomerId && (
                 <div className="space-y-4">
                    <h3 className="text-lg font-medium">Anexos da Proposta</h3>
                    <ProposalAttachmentUploader
                        userId={user.uid}
                        proposalId={proposalId}
                        initialAttachments={form.getValues('attachments') || []}
                        onAttachmentsChange={handleAttachmentsChange}
                        isReadOnly={isReadOnly}
                    />
                 </div>
            )}
          </div>
        </ScrollArea>
        {!isReadOnly && (
            <div className="flex justify-end pt-8">
                <Button type="submit">Salvar Proposta</Button>
            </div>
        )}
      </form>
    </Form>
  );
}
