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
import { format, parse, isValid } from 'date-fns';
import { commissionStatuses } from '@/lib/config-data';
import type { Proposal } from '@/lib/types';
import { useEffect } from 'react';

const commissionSchema = z.object({
  commissionStatus: z.string({ required_error: 'Selecione um status.' }),
  amountPaid: z.coerce.number().min(0, 'O valor pago é obrigatório.'),
  commissionPaymentDate: z.string().optional().refine(val => {
    if (!val) return true;
    const parsed = parse(val, 'dd/MM/yyyy', new Date());
    return isValid(parsed);
  }, {
    message: "Data inválida. Use o formato dd/MM/aaaa.",
  }),
});

export type CommissionFormValues = z.infer<typeof commissionSchema>;

interface CommissionFormProps {
  proposal?: Proposal;
  onSubmit: (data: CommissionFormValues) => void;
}

const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    return value;
};


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
          ? format(new Date(proposal.commissionPaymentDate), 'dd/MM/yyyy')
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
                        <FormItem>
                            <FormLabel>Data de Pagamento</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="dd/mm/aaaa"
                                    {...field}
                                    onChange={(e) => field.onChange(handleDateMask(e))}
                                    value={field.value || ''}
                                    maxLength={10}
                                    className="w-[240px]"
                                />
                            </FormControl>
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
