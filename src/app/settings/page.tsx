
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader title="Configurações" />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, esta área permitirá que você personalize as listas de opções usadas em todo o sistema, como produtos, bancos e status.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
