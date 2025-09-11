import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar link correto para artigos
export function getArticleLink(article: { id: string; columnist?: { id: string } | null }) {
  if (article.columnist?.id) {
    return `/colunista/${article.columnist.id}/artigo/${article.id}`;
  }
  return `/artigo/${article.id}`;
}
