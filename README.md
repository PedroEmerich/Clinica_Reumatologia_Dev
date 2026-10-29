# Creass · Portal (versão demonstrativa)

Portal de agendamento da **Creass Reumatologia e Especialidades Médicas**, feito para apresentar ao cliente. É só front-end: **não tem back-end nem banco de dados**. Os dados são fictícios, gerados no navegador e salvos no `localStorage`, então tudo o que se faz na demonstração (agendar, confirmar, cancelar, bloquear agenda) continua lá ao recarregar a página.

Visual baseado na [landing page da clínica](https://pedroemerich.github.io/Clinica_Reumatologia_LG/): mesma paleta (vermelho `#B3121D`, bordô `#7E0F17`, off-white `#F7F2EE`, rosé `#F6E4E3`, grafite `#2A2A2A`), fontes Instrument Serif, Geist e Geist Mono e o símbolo de vértebras.

## As duas faces

**Paciente** (`/#/paciente`), pensada primeiro para o celular, com barra de abas embaixo:

- Início com a próxima consulta, contagem de dias, checklist do que levar e status "aberto agora"
- Agendamento em etapas: especialidade → profissional (com o próximo horário livre) → calendário com disponibilidade → horários de manhã e tarde → detalhes (primeira consulta ou retorno, convênio) → revisão
- Minhas consultas (próximas e anteriores), com detalhes, cancelamento, remarcação, pré-consulta (sintomas, medicamentos, escala de dor), "adicionar à agenda" (arquivo `.ics`), rota no mapa e WhatsApp
- Perfil com dados de contato, convênio e preferências de lembrete
- Avisos (ex.: "consulta confirmada pela clínica")

**Equipe** (`/#/equipe`), pensada primeiro para o desktop, com menu lateral (no celular vira barra de abas):

- Painel com indicadores do dia, fila de atendimento com o próximo passo de cada paciente (confirmar → registrar chegada → chamar → finalizar, ou faltou) e ocupação da semana por profissional
- Agenda em grade por profissional (dia) ou por semana, com linha do "agora", horário de almoço, clique em horário livre para agendar e clique na consulta para abrir o painel (status, pré-consulta, remarcar, cancelar com motivo, observações internas)
- Solicitações feitas pelo portal e pelo WhatsApp, com confirmação individual ou de todas
- Pacientes com busca, filtro por convênio, ficha com histórico e cadastro de novos pacientes
- Profissionais e horários: cadastro de novos profissionais (com opção de já criar o acesso ao sistema), edição, desativação, dias de atendimento, início e fim, duração da consulta e bloqueios de data. As mudanças aparecem na hora para o paciente
- Relatórios dos últimos 7, 30 ou 90 dias: consultas realizadas, primeiras consultas, taxa de faltas, cancelamentos e agendamentos pelo portal (com comparação ao período anterior), volume por dia ou semana, por especialidade, por convênio e por canal, e desempenho por profissional. Exporta planilha (CSV) e imprime ou salva em PDF

## Login da equipe e cargos

A equipe entra só com **e-mail e senha**. O cargo vem do cadastro do usuário (na versão final, do banco de dados) e decide o que aparece depois do login:

| Cargo | O que vê |
| --- | --- |
| Recepção | Painel do dia, agenda de todos os profissionais, solicitações e pacientes |
| Corpo clínico | "Meu dia", a própria agenda, os próprios pacientes, os próprios horários e os próprios relatórios. O login fica vinculado a um profissional |
| Gestão | Tudo, incluindo cadastro de profissionais, relatórios da clínica inteira e a tela **Usuários**, onde se cadastra a equipe e se escolhe o cargo |

Telas fora do cargo somem do menu e também ficam bloqueadas se alguém digitar o endereço direto.

Contas de demonstração (senha de todas: `demonstracao`): `recepcao@creass.com.br`, `andrea@creass.com.br` e `gestao@creass.com.br`. A tela de login tem atalhos para elas. Também existe `bruno@creass.com.br`, desativado, para mostrar o bloqueio de acesso.

A sessão vale por aba, então dá para abrir a recepção numa aba e a médica em outra.

## Dica para a apresentação

Abra o paciente e a equipe em **duas abas lado a lado**. As abas ficam sincronizadas: um pedido feito pelo paciente aparece em Solicitações, e a confirmação da recepção aparece nos avisos do paciente.

O botão **Restaurar**, na barra escura do topo, volta os dados ao estado inicial. A demonstração também é recriada sozinha a cada novo dia, para que as datas continuem fazendo sentido.

## Rodar localmente

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
git clone https://github.com/PedroEmerich/Clinica_Reumatologia_Dev.git
cd Clinica_Reumatologia_Dev
npm install
npm run dev
```

Abra `http://localhost:5173` no computador. O terminal também mostra um endereço `Network`, como `http://192.168.0.10:5173`: com o celular **na mesma rede Wi-Fi**, abra esse endereço no navegador do celular.

Para gerar a versão de produção: `npm run build` (sai em `dist/`).

## Publicação (link para celular e desktop)

O workflow `.github/workflows/deploy.yml` publica no GitHub Pages a cada push. Na primeira vez:

1. No GitHub, vá em *Settings → Pages* e, em *Source*, escolha **GitHub Actions**.
2. Em *Actions → Publicar no GitHub Pages*, clique em **Run workflow**.
3. O site fica em `https://pedroemerich.github.io/Clinica_Reumatologia_Dev/`.

As rotas usam `#` (HashRouter) e os caminhos são relativos, então funciona em qualquer subpasta sem configurar servidor.

## Estrutura

```
src/
  data/       dados da clínica, tipos e gerador dos dados fictícios
  lib/        estado (localStorage + sincronização entre abas), datas, .ics
  components/ peças compartilhadas (modal, calendário, toasts, selos)
  pages/      entrada e login
  patient/    telas do paciente
  staff/      telas da equipe
  styles/     base.css (tokens e fontes) e app.css (componentes e telas)
```

## Dados a confirmar com a clínica

- **Profissionais**: só a Dra. Andrea Soares dos Santos (CRM-SP 99852) é real. Os demais são de exemplo e aparecem marcados como "Profissional de exemplo".
- **Convênios**: a lista é ilustrativa.
- **Horários**: seg. a qui. 8h às 17h, sex. 8h30 às 17h, com almoço das 12h às 13h (o almoço é suposição).

## Para a versão final (com back-end)

Login real (CPF e código por WhatsApp para o paciente, perfis de acesso para a equipe), banco de dados, envio automático de lembretes e confirmações pelo WhatsApp, prontuário e adequação à LGPD.
