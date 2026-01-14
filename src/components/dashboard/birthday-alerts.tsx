import { customers } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellRing, UserCheck } from 'lucide-react';

async function BirthdayAlertItem({ customerName }: { customerName: string }) {
  // Mocked alert message to avoid Genkit error due to missing API key.
  const alertMessage = `Lembrete: O aniversário de 75 anos de ${customerName} está se aproximando.`;

  return (
    <Alert>
      <BellRing className="h-4 w-4" />
      <AlertTitle>{customerName}</AlertTitle>
      <AlertDescription>{alertMessage}</AlertDescription>
    </Alert>
  );
}

export async function BirthdayAlerts() {
  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const upcoming75 = customers.filter(c => getAge(c.dateOfBirth) >= 74);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Alertas de Aniversário (75 anos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming75.length > 0 ? (
          upcoming75.map((customer) => (
            <BirthdayAlertItem key={customer.id} customerName={customer.name} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <UserCheck className="h-8 w-8 mb-2" />
            <p>Nenhum cliente próximo dos 75 anos.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
