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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload, User, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  displayName: z.string().min(2, "O apelido deve ter pelo menos 2 caracteres.").or(z.literal('')).optional(),
  fullName: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres.").or(z.literal('')).optional(),
  photoURL: z.string().or(z.literal('')).optional(),
  birthDate: z.string().optional().refine(val => !val || !isNaN(parse(val, 'dd/MM/yyyy', new Date()).getTime()), {
    message: "Data inválida. Use o formato dd/mm/aaaa.",
  }),
  phone: z.string().optional(),
  email: z.string().email('Email inválido.'),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userProfile?: UserProfile | null;
  onSubmit: (data: Partial<ProfileFormValues>) => void;
}

export function ProfileForm({ userProfile, onSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      fullName: '',
      photoURL: '',
      birthDate: '',
      phone: '',
      email: userProfile?.email || '',
    },
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (userProfile) {
      form.reset({
        ...userProfile,
        birthDate: userProfile.birthDate ? format(parse(userProfile.birthDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : '',
        phone: userProfile.phone || '',
        displayName: userProfile.displayName || '',
        fullName: userProfile.fullName || '',
        photoURL: userProfile.photoURL || '',
      });
      setPhotoPreview(userProfile.photoURL || null);
    }
  }, [userProfile, form]);
  
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        form.setValue('photoURL', dataUrl, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/^(\d{2})(\d)/, "($1) $2");
    if (value.length > 9) {
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
    }
    e.target.value = value;
    form.setValue('phone', value, { shouldValidate: true });
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    value = value.replace(/(\d{2})(\d)/, '$1/$2');
    e.target.value = value;
    form.setValue('birthDate', value, { shouldValidate: true });
  };

  const handleFormSubmit = (data: ProfileFormValues) => {
    const dataToSubmit: Partial<UserProfile> = {
      // Use || undefined to convert empty strings to undefined for optional fields
      displayName: data.displayName || undefined,
      fullName: data.fullName || undefined,
      photoURL: data.photoURL || undefined,
      phone: data.phone || undefined,
      email: data.email, // email is required
      birthDate: data.birthDate ? format(parse(data.birthDate, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd') : undefined,
    };
    onSubmit(dataToSubmit);
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        
        <FormField
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto de Perfil</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview || undefined} alt="Foto de perfil"/>
                  <AvatarFallback className="text-3xl">
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className='flex items-center gap-2'>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar Foto
                    </Button>
                    {photoPreview && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => {
                            setPhotoPreview(null);
                            form.setValue('photoURL', '', { shouldValidate: true });
                        }}>
                           <X className='h-4 w-4' />
                        </Button>
                    )}
                </div>

                <FormControl>
                  <Input 
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png, image/jpeg, image/gif"
                    />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} value={field.value || ''}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Como quer ser chamado</FormLabel>
                <FormControl>
                  <Input placeholder="Seu apelido" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 90000-0000" {...field} value={field.value || ''} onChange={handlePhoneChange} maxLength={15} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Data de Nascimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <div className="relative">
                          <Input
                              placeholder="dd/mm/aaaa"
                              {...field}
                              value={field.value || ''}
                              onChange={handleBirthDateChange}
                              maxLength={10}
                              className="w-[240px] pr-8"
                          />
                          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parse(field.value, 'dd/MM/yyyy', new Date()) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "dd/MM/yyyy") : '')}
                      defaultMonth={field.value ? parse(field.value, 'dd/MM/yyyy', new Date()) : new Date(new Date().setFullYear(new Date().getFullYear() - 30))}
                      locale={ptBR}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      captionLayout="dropdown-buttons"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
}
