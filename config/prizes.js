// =============================================================
//  CATÁLOGO PADRÃO (sementes)
//  Estes itens são usados na primeira vez. Depois que o Upstash
//  está ligado, você gerencia os itens pelo painel /admin
//  (criar, editar preço, remover). Editar este arquivo só afeta
//  quem ainda NÃO tem Upstash configurado.
//
//  Campos de cada item:
//   id        -> identificador único, sem espaços
//   nome      -> nome exibido
//   descricao -> texto curto
//   custo     -> preço em pontos
//   tipo      -> "digital" (entrega código) ou "fisico" (envio)
//   estoque   -> quantidade (null = ilimitado)
//   imagem    -> URL de imagem (opcional)
//
//  Em TODO resgate o site pede: nome completo, telefone, email,
//  endereço (opcional) e usuário na Kick. Isso é padrão, não
//  precisa configurar por item.
// =============================================================

export const MOEDA = "pontos";

export const PREMIOS = [
  { id: "ticket-sorteio", nome: "Ticket de sorteio", descricao: "1 número para o próximo sorteio da live.", custo: 5000, tipo: "digital", estoque: null, imagem: "" },
  { id: "vip-7dias", nome: "VIP no chat (7 dias)", descricao: "Destaque e cor especial no chat por 7 dias.", custo: 8000, tipo: "digital", estoque: null, imagem: "" },
  { id: "giftcard-50", nome: "Gift card R$50", descricao: "Código de gift card enviado na hora.", custo: 30000, tipo: "digital", estoque: 10, imagem: "" },
  { id: "mousepad", nome: "Mousepad gamer", descricao: "Enviado pelo correio para todo o Brasil.", custo: 25000, tipo: "fisico", estoque: 5, imagem: "" },
  { id: "headset", nome: "Headset", descricao: "Enviado pelo correio para todo o Brasil.", custo: 80000, tipo: "fisico", estoque: 2, imagem: "" },
];
