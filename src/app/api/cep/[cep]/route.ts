import { NextResponse } from 'next/server';

/**
 * 🛡️ BACKEND PROXY (Node.js / Next.js API Route)
 * Esta função roda no servidor, não no navegador do usuário.
 * Ela é imune a bloqueios de rede do browser (CORS) e extensões.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep: rawCep } = await params;
  const cep = rawCep.replace(/\D/g, '');

  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP Inválido' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache de 1 hora no servidor
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
