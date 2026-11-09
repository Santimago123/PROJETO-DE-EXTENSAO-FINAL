import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

interface DadosChamado {
    cliente: string;
    telefone: string;
    descricao: string;
    observacao?: string;
    dataHora: string; // Exemplo de formato: "2026-11-10T14:00:00"
}

export async function criarChamadoNaAgenda({ cliente, telefone, descricao, observacao, dataHora }: DadosChamado) {
    const inicio = new Date(dataHora);
    // Define duração padrão de 1 hora para o atendimento
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);

    const evento = {
        summary: `🛠️ Chamado TI: ${cliente}`,
        description: `👤 Cliente: ${cliente}\n📞 Contato: ${telefone}\n💻 Problema: ${descricao}\n📌 Obs: ${observacao || 'Nenhuma'}`,
        start: {
            dateTime: inicio.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: fim.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
    };

    const response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: evento,
    });

    return response.data;
}