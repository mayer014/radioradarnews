/**
 * Gerador de artes para Utilidade Pública (Prestadores e Vagas)
 * Canvas 1080x1080 com layout customizado para cada tipo
 */

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

// Cores por tipo
const TYPE_COLORS = {
  service_provider: {
    primary: '#10b981',    // green-500
    primaryDark: '#059669', // green-600
    accent: '#d1fae5',     // green-100
    gradient1: '#064e3b',  // green-900
    gradient2: '#065f46',  // green-800
    icon: '🔧',
    label: 'PRESTADOR DE SERVIÇO',
  },
  job_listing: {
    primary: '#3b82f6',    // blue-500
    primaryDark: '#2563eb', // blue-600
    accent: '#dbeafe',     // blue-100
    gradient1: '#1e3a5f',  // dark blue
    gradient2: '#1e40af',  // blue-800
    icon: '💼',
    label: 'VAGA DE EMPREGO',
  },
};

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

  // job_listing
  const salary = data.salary ? `\n💰 ${data.salary}` : '';
  const jt = data.jobType ? ` (${JOB_TYPE_LABELS[data.jobType] || data.jobType})` : '';
  const cityText = data.city ? ` em ${data.city}` : '';
  return `💼 ${data.title}${jt}${cityText}\n🏢 ${data.company || ''}${salary}\n\n📱 Candidate-se pelo WhatsApp!\n\n🔗 Veja mais: ${siteUrl}/vagas\n\n${hashtags}`;
}

export async function generateUtilityArt(data: UtilityArtData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas não suportado')); return; }

    canvas.width = 1080;
    canvas.height = 1080;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const colors = TYPE_COLORS[data.type];

    // ─── Background gradient ───
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, colors.gradient1);
    bg.addColorStop(1, colors.gradient2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle pattern overlay
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < canvas.width; i += 60) {
      for (let j = 0; j < canvas.height; j += 60) {
        ctx.beginPath();
        ctx.arc(i, j, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Top badge ───
    const badgeY = 80;
    const badgeText = colors.label;
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 48;
    const badgeX = (canvas.width - badgeW) / 2;

    // Badge background
    ctx.fillStyle = colors.primary;
    const badgeH = 44;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, canvas.width / 2, badgeY + badgeH / 2);

    // ─── Icon circle ───
    const iconY = 200;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, iconY, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '72px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(colors.icon, canvas.width / 2, iconY);

    // ─── Main content area ───
    const contentStartY = 320;

    if (data.type === 'service_provider') {
      drawServiceProviderContent(ctx, canvas, data, colors, contentStartY);
    } else {
      drawJobListingContent(ctx, canvas, data, colors, contentStartY);
    }

    // ─── Bottom bar with branding ───
    const barH = 70;
    const barY = canvas.height - barH;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, barY, canvas.width, barH);

    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('radioradar.news • Utilidade Pública', canvas.width / 2, barY + barH / 2);

    // Export
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar imagem'));
    }, 'image/png', 1.0);
  });
}

function drawServiceProviderContent(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: UtilityArtData,
  colors: typeof TYPE_COLORS['service_provider'],
  startY: number
) {
  const pad = 80;
  let y = startY;

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
  const nameLines = wrapText(ctx, data.name || 'Prestador', canvas.width - pad * 2);
  for (const line of nameLines.slice(0, 2)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += 62;
  }

  // Divider
  y += 10;
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 80, y);
  ctx.lineTo(canvas.width / 2 + 80, y);
  ctx.stroke();
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
      // Info box
      const boxW = 500;
      const boxH = 56;
      const boxX = (canvas.width - boxW) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(boxX, y - 20, boxW, boxH, 12);
      ctx.fill();

      ctx.font = '28px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${item.icon}  ${item.text}`, canvas.width / 2, y + 8);
      y += 70;
    }
  }

  // CTA
  y = Math.max(y + 20, canvas.height - 180);
  drawCTA(ctx, canvas, y, colors.primary, 'Entre em contato pelo WhatsApp!');
}

function drawJobListingContent(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: UtilityArtData,
  colors: typeof TYPE_COLORS['job_listing'],
  startY: number
) {
  const pad = 80;
  let y = startY;

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
  const titleLines = wrapText(ctx, data.title || 'Vaga', canvas.width - pad * 2);
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += 58;
  }

  // Company
  if (data.company) {
    y += 8;
    ctx.font = '32px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = colors.accent;
    ctx.fillText(`🏢 ${data.company}`, canvas.width / 2, y);
    y += 48;
  }

  // Divider
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 80, y);
  ctx.lineTo(canvas.width / 2 + 80, y);
  ctx.stroke();
  y += 40;

  // Info items
  const infoItems: { icon: string; text: string }[] = [];
  if (data.jobType) infoItems.push({ icon: '📋', text: JOB_TYPE_LABELS[data.jobType] || data.jobType });
  if (data.city) infoItems.push({ icon: '📍', text: data.city });
  if (data.salary) infoItems.push({ icon: '💰', text: data.salary });

  for (const item of infoItems) {
    const boxW = 500;
    const boxH = 56;
    const boxX = (canvas.width - boxW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(boxX, y - 20, boxW, boxH, 12);
    ctx.fill();

    ctx.font = '28px "Segoe UI Emoji", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${item.icon}  ${item.text}`, canvas.width / 2, y + 8);
    y += 70;
  }

  // Requirements snippet
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

  // CTA
  y = Math.max(y + 20, canvas.height - 180);
  drawCTA(ctx, canvas, y, colors.primary, 'Candidate-se pelo WhatsApp!');
}

function drawCTA(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, y: number, color: string, text: string) {
  const ctaW = 600;
  const ctaH = 64;
  const ctaX = (canvas.width - ctaW) / 2;

  // CTA button
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(ctaX, y, ctaW, ctaH, 32);
  ctx.fill();

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(ctaX, y, ctaW, ctaH, 32);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return phone;
}
