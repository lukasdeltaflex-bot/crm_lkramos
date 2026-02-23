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
    return isValid(parsed) && val.length === 10;
  }, {
    message: "Data inválida. Use o formato dd/MM/aaaa.",
  }),
});

export type CommissionFormValues = z.infer<typeof commissionSchema>;

interface CommissionFormProps {
  proposal?: Proposal;
  onSubmit: (data: CommissionFormValues) => void;
}

const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").substring(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
    return v;
};


export function CommissionForm({ proposal, onSubmit }: CommissionFormProps) {
  // 🛡️ BLINDAGEM NUCLEAR V8: Garantindo defaultValues em todos os campos para evitar uncontrolled inputs
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      commissionStatus: 'Pendente',
      amountPaid: 0,
      commissionPaymentDate: '',
    },
  });

  useEffect(() => {
    if (proposal) {
      form.reset({
        commissionStatus: proposal.commissionStatus || 'Pendente',
        amountPaid: proposal.amountPaid || 0,
        commissionPaymentDate: proposal.commissionPaymentDate
          ? format(new Date(proposal.commissionPaymentDate), 'dd/MM/yyyy')
          : '',
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
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-[10px] font-black text-muted-foreground">R$</span>
                                    <Input type="number" step="0.01" className="pl-9 font-bold text-primary" placeholder="0.00" {...field} value={field.value ?? 0} />
                                </div>
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
                            <FormLabel>Data de Pagamento (Manual)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="dd/mm/aaaa"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(applyDateMask(e.target.value))}
                                    maxLength={10}
                                    className="w-full"
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