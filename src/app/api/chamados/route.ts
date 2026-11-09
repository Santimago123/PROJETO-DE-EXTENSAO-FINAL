import { NextResponse } from 'next/server';
import { criarChamadoNaAgenda } from '@/lib/googleCalendar';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente, telefone, descricao, observacao, dataHora } = body;

    // Envia o chamado para o Google Agenda
    const agendamento = await criarChamadoNaAgenda({
      cliente,
      telefone,
      descricao,
      observacao,
      dataHora,
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Chamado enviado para a agenda do técnico com sucesso!',
      eventUrl: agendamento.htmlLink,
    });
  } catch (error) {
    console.error('Erro na integração com a agenda:', error);
    return NextResponse.json(
      { sucesso: false, erro: 'Não foi possível gravar o agendamento.' },
      { status: 500 }
    );
  }
}