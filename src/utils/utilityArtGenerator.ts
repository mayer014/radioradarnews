/**
 * Gerador de artes para Utilidade Pública (Prestadores e Vagas)
 * Canvas 1080x1080 com layout customizado via template salvo
 */

import { UtilityArtTemplate, DEFAULT_UTILITY_TEMPLATE } from '@/types/artTemplate';

export interface UtilityArtData {
  type: 'service_provider' | 'job_listing';
  // Prestador
  name?: string;
  description?: string;
  city?: string;
  whatsapp?: string;
  neighborhood?: string;
  // Vaga
  title?: string;
  company?: string;
  jobType?: string;
  salary?: string;
  requirements?: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  freelancer: 'Freelancer',
  temporario: 'Temporário',
};

export function generateUtilityCaption(data: UtilityArtData, siteUrl: string): string {
  const hashtags = '#utilidadepublica #radioradarnews #serviços #oportunidade';

  if (data.type === 'service_provider') {
    const cityText = data.city ? ` em ${data.city}` : '';
    const desc = data.description
      ? `\n\n📋 ${data.description.length > 180 ? data.description.substring(0, 177) + '...' : data.description}`
      : '';
    return `🔧 ${data.name}${cityText}${desc}\n\n📱 Entre em contato pelo WhatsApp!\n\n🔗 Veja mais: ${siteUrl}/prestadores\n\n${hashtags}`;
  }

  const salary = data.salary ? `\n💰 ${data.salary}` : '';
  const jt = data.jobType ? ` (${JOB_TYPE_LABELS[data.jobType] || data.jobType})` : '';
  const cityText = data.city ? ` em ${data.city}` : '';
  return `💼 ${data.title}${jt}${cityText}\n🏢 ${data.company || ''}${salary}\n\n📱 Candidate-se pelo WhatsApp!\n\n🔗 Veja mais: ${siteUrl}/vagas\n\n${hashtags}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) { reject(new Error('No URL')); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/**
 * Generate utility art using the saved template settings
 */
export async function generateUtilityArt(
  data: UtilityArtData,
  template?: UtilityArtTemplate | null
): Promise<Blob> {
  const t = template || DEFAULT_UTILITY_TEMPLATE;

  // Determine colors based on type
  const isProvider = data.type === 'service_provider';
  const gradient1 = isProvider ? t.colors.providerGradient1 : t.colors.jobGradient1;
  const gradient2 = isProvider ? t.colors.providerGradient2 : t.colors.jobGradient2;
  const accent = isProvider ? t.colors.providerAccent : t.colors.jobAccent;
  const label = isProvider ? 'PRESTADOR DE SERVIÇO' : 'VAGA DE EMPREGO';

  // Pre-load images
  const [bgImage, logoImage] = await Promise.all([
    t.background.imageUrl ? loadImage(t.background.imageUrl).catch(() => null) : null,
    t.logo.enabled && t.logo.imageUrl ? loadImage(t.logo.imageUrl).catch(() => null) : null,
  ]);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas não suportado')); return; }

    canvas.width = t.canvas.width;
    canvas.height = t.canvas.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ─── Background ───
    if (bgImage) {
      const bgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
      const canvasAspect = canvas.width / canvas.height;
      let bw, bh, bx, by;
      if (bgAspect > canvasAspect) { bh = canvas.height; bw = bh * bgAspect; bx = -(bw - canvas.width) / 2; by = 0; }
      else { bw = canvas.width; bh = bw / bgAspect; bx = 0; by = -(bh - canvas.height) / 2; }
      ctx.drawImage(bgImage, bx, by, bw, bh);
    } else {
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, gradient1);
      bg.addColorStop(1, gradient2);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Subtle dot pattern
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < canvas.width; i += 60) {
      for (let j = 0; j < canvas.height; j += 60) {
        ctx.beginPath(); ctx.arc(i, j, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ─── Top badge ───
    const badgeY = 80;
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    const badgeW = ctx.measureText(label).width + 48;
    const badgeX = (canvas.width - badgeW) / 2;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, 44, 22); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, badgeY + 22);

    // ─── Main content area ───
    const contentStartY = 320;

    if (isProvider) {
      drawServiceProviderContent(ctx, canvas, data, accent, t, contentStartY);
    } else {
      drawJobListingContent(ctx, canvas, data, accent, t, contentStartY);
    }

    // ─── Bottom bar with branding ───
    const barH = 70;
    const barY = canvas.height - barH;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, barY, canvas.width, barH);
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.branding, canvas.width / 2, barY + barH / 2);

    // ─── Logo (free position from template) ───
    if (t.logo.enabled && logoImage) {
      const lAspect = logoImage.naturalWidth / logoImage.naturalHeight;
      const lH = t.logo.size, lW = lH * lAspect;
      const lX = (canvas.width * t.logo.position.x / 100) - (lW / 2);
      const lY = (canvas.height * t.logo.position.y / 100) - (lH / 2);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 15;
      ctx.drawImage(logoImage, lX, lY, lW, lH);
      ctx.restore();
    }

    // Export
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar imagem'));
    }, 'image/png', 1.0);
  });
}

// ─── Drawing helpers ───

function drawServiceProviderContent(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: UtilityArtData,
  accent: string,
  t: UtilityArtTemplate,
  startY: number
) {
  const pad = 80;
  let y = startY;

  // Name
  ctx.fillStyle = t.title.color;
  ctx.textAlign = 'center';
  ctx.font = `${t.title.fontWeight} ${t.title.fontSize}px "Segoe UI", Arial, sans-serif`;
  const nameLines = wrapText(ctx, data.name || 'Prestador', canvas.width - pad * 2);
  for (const line of nameLines.slice(0, t.title.maxLines)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += t.title.lineHeight;
  }

  // Divider
  y += 10;
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(canvas.width / 2 - 80, y); ctx.lineTo(canvas.width / 2 + 80, y); ctx.stroke();
  y += 40;

  // Description
  if (data.description) {
    ctx.font = '28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const descLines = wrapText(ctx, data.description, canvas.width - pad * 2);
    for (const line of descLines.slice(0, 4)) {
      ctx.fillText(line, canvas.width / 2, y);
      y += 38;
    }
    y += 20;
  }

  // Info cards
  const infoItems: { icon: string; text: string }[] = [];
  if (data.city) infoItems.push({ icon: '📍', text: data.city + (data.neighborhood ? ` - ${data.neighborhood}` : '') });
  if (data.whatsapp) infoItems.push({ icon: '📱', text: formatWhatsApp(data.whatsapp) });

  if (infoItems.length > 0) {
    y += 10;
    for (const item of infoItems) {
      const boxW = 500, boxH = 56;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.roundRect((canvas.width - boxW) / 2, y - 20, boxW, boxH, 12); ctx.fill();
      ctx.font = '28px "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      ctx.fillText(`${item.icon}  ${item.text}`, canvas.width / 2, y + 8);
      y += 70;
    }
  }

  // CTA with WhatsApp number
  y = Math.max(y + 20, canvas.height - 180);
  const ctaLabel = data.whatsapp
    ? `📱 ${formatWhatsApp(data.whatsapp)}`
    : t.ctaText.provider;
  drawCTA(ctx, canvas, y, accent, ctaLabel);
}

function drawJobListingContent(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: UtilityArtData,
  accent: string,
  t: UtilityArtTemplate,
  startY: number
) {
  const pad = 80;
  let y = startY;

  // Title
  ctx.fillStyle = t.title.color;
  ctx.textAlign = 'center';
  ctx.font = `${t.title.fontWeight} ${t.title.fontSize}px "Segoe UI", Arial, sans-serif`;
  const titleLines = wrapText(ctx, data.title || 'Vaga', canvas.width - pad * 2);
  for (const line of titleLines.slice(0, t.title.maxLines)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += t.title.lineHeight;
  }

  // Company
  if (data.company) {
    y += 8;
    ctx.font = '32px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`🏢 ${data.company}`, canvas.width / 2, y);
    y += 48;
  }

  // Divider
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(canvas.width / 2 - 80, y); ctx.lineTo(canvas.width / 2 + 80, y); ctx.stroke();
  y += 40;

  // Info items
  const infoItems: { icon: string; text: string }[] = [];
  if (data.jobType) infoItems.push({ icon: '📋', text: JOB_TYPE_LABELS[data.jobType] || data.jobType });
  if (data.city) infoItems.push({ icon: '📍', text: data.city });
  if (data.salary) infoItems.push({ icon: '💰', text: data.salary });

  for (const item of infoItems) {
    const boxW = 500, boxH = 56;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect((canvas.width - boxW) / 2, y - 20, boxW, boxH, 12); ctx.fill();
    ctx.font = '28px "Segoe UI Emoji", "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(`${item.icon}  ${item.text}`, canvas.width / 2, y + 8);
    y += 70;
  }

  // Requirements
  if (data.requirements) {
    y += 10;
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const reqLines = wrapText(ctx, `Requisitos: ${data.requirements}`, canvas.width - pad * 2);
    for (const line of reqLines.slice(0, 2)) {
      ctx.fillText(line, canvas.width / 2, y);
      y += 32;
    }
  }

  // CTA with WhatsApp number
  y = Math.max(y + 20, canvas.height - 180);
  const ctaLabel = data.whatsapp
    ? `📱 ${formatWhatsApp(data.whatsapp)}`
    : t.ctaText.job;
  drawCTA(ctx, canvas, y, accent, ctaLabel);
}

function drawCTA(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, y: number, color: string, text: string) {
  const ctaW = 600, ctaH = 64;
  const ctaX = (canvas.width - ctaW) / 2;

  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(ctaX, y, ctaW, ctaH, 32); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, y + ctaH / 2);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 13 && digits.startsWith('55')) return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  return phone;
}
