
'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { commissionStatuses } from '@/lib/config-data';
import type { Proposal } from '@/lib/types';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

const commissionSchema = z.object({
  commissionStatus: z.string({ required_error: 'Selecione um status.' }),
  amountPaid: z.coerce.number().min(0, 'O valor pago é obrigatório.'),
  commissionPaymentDate: z.date().optional(),
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

interface CommissionFormProps {
  proposal?: Proposal;
  onSubmit: (data: CommissionFormValues) => void;
}

export function CommissionForm({ proposal, onSubmit }: CommissionFormProps) {
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
  });

  useEffect(() => {
    if (proposal) {
      form.reset({
        commissionStatus: proposal.commissionStatus,
        amountPaid: proposal.amountPaid || 0,
        commissionPaymentDate: proposal.commissionPaymentDate
          ? new Date(proposal.commissionPaymentDate)
          : undefined,
      });
    }
  }, [proposal, form]);

  if (!proposal) {
    return <div className="p-4 text-center">Selecione uma proposta para editar.</div>;
  }

  const status = form.watch('commissionStatus');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 gap-4">
            <FormField
                control={form.control}
                name="commissionStatus"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status da Comissão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {commissionStatuses.map((status) => (
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
            
            {(status === 'Paga' || status === 'Parcial') && (
                <>
                    <FormField
                        control={form.control}
                        name="amountPaid"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Pago</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="commissionPaymentDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                            <FormLabel>Data de Pagamento</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'w-[240px] pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                    )}
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
                                disabled={(date) =>
                                    date > new Date() || date < new Date('1900-01-01')
                                }
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </>
            )}

        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
}
