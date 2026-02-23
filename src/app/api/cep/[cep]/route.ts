
import { NextResponse } from 'next/server';

/**
 * 🛡️ PROXY SEGURO VIACEP
 * Bypassa bloqueios de CORS e restrições de rede do navegador fazendo a chamada pelo servidor.
 */
export async function GET(
  request: Request,
  { params }: { params: { cep: string } }
) {
  const cep = params.cep.replace(/\D/g, '');

  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP Inválido' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache de 1 hora
    });

    if (!response.ok) {
      throw new Error('Falha na comunicação com ViaCEP');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('CEP Proxy Error:', error);
    return NextResponse.json({ error: 'Falha na rede externa' }, { status: 500 });
  }
}
