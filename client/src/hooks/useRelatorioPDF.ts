/**
 * Hook para geração de relatório PDF premium do RAPHA GURU
 * Usa jsPDF + html2canvas para capturar gráficos e gerar PDF formatado
 */
import { useCallback, useState } from "react";

interface MercadoStat {
  tipo: string;
  total: number;
  acertos: number;
  taxa: number;
  scoreMedio: number;
}

interface LigaStat {
  liga: string;
  total: number;
  greens: number;
  reds: number;
  taxaAcerto: number;
  scoreMedio: number;
  oddMedia: number;
}

interface RelatorioDados {
  periodo: string;
  totalPalpites: number;
  greens: number;
  reds: number;
  taxaAcerto: number;
  scoreMedio: number;
  oddMedia: number;
  mercados: MercadoStat[];
  ligas: LigaStat[];
  evolucaoScore: { data: string; score: number }[];
  nomeUsuario?: string;
}

export function useRelatorioPDF() {
  const [gerando, setGerando] = useState(false);

  const gerarPDF = useCallback(async (dados: RelatorioDados, elementId?: string) => {
    setGerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ─── Cores ────────────────────────────────────────────────────────────
      const verde = [34, 197, 94] as [number, number, number];
      const vermelho = [239, 68, 68] as [number, number, number];
      const amarelo = [234, 179, 8] as [number, number, number];
      const cinzaEscuro = [15, 15, 25] as [number, number, number];
      const cinzaMedio = [30, 30, 50] as [number, number, number];
      const cinzaClaro = [60, 60, 80] as [number, number, number];
      const branco = [255, 255, 255] as [number, number, number];
      const primario = [34, 197, 94] as [number, number, number];

      // ─── Fundo da página ──────────────────────────────────────────────────
      doc.setFillColor(...cinzaEscuro);
      doc.rect(0, 0, pageW, pageH, "F");

      // ─── Header ───────────────────────────────────────────────────────────
      // Barra verde no topo
      doc.setFillColor(...primario);
      doc.rect(0, 0, pageW, 2, "F");

      // Logo / Título
      doc.setFillColor(...cinzaMedio);
      doc.roundedRect(margin, y, contentW, 28, 4, 4, "F");

      doc.setTextColor(...primario);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("⚡ RAPHA GURU", margin + 6, y + 10);

      doc.setTextColor(...branco);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Relatório de Análise de Precisão", margin + 6, y + 17);
      doc.text(`Período: ${dados.periodo}`, margin + 6, y + 23);

      if (dados.nomeUsuario) {
        doc.setTextColor(150, 150, 180);
        doc.setFontSize(9);
        doc.text(`Analista: ${dados.nomeUsuario}`, pageW - margin - 2, y + 10, { align: "right" });
      }

      const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      doc.setTextColor(120, 120, 150);
      doc.setFontSize(8);
      doc.text(`Gerado em ${dataGeracao}`, pageW - margin - 2, y + 23, { align: "right" });

      y += 35;

      // ─── Cards de métricas principais ─────────────────────────────────────
      const cardW = (contentW - 9) / 4;
      const metricas = [
        { label: "Total Palpites", val: String(dados.totalPalpites), cor: branco, icon: "📊" },
        { label: "Greens", val: String(dados.greens), cor: verde, icon: "🟢" },
        { label: "Taxa de Acerto", val: `${dados.taxaAcerto.toFixed(1)}%`, cor: dados.taxaAcerto >= 60 ? verde : dados.taxaAcerto >= 45 ? amarelo : vermelho, icon: "🎯" },
        { label: "Score Médio", val: `${dados.scoreMedio.toFixed(0)}/100`, cor: dados.scoreMedio >= 70 ? verde : dados.scoreMedio >= 50 ? amarelo : vermelho, icon: "⭐" },
      ];

      for (let i = 0; i < metricas.length; i++) {
        const x = margin + i * (cardW + 3);
        doc.setFillColor(...cinzaMedio);
        doc.roundedRect(x, y, cardW, 22, 3, 3, "F");

        // Borda colorida no topo do card
        doc.setFillColor(...metricas[i].cor);
        doc.roundedRect(x, y, cardW, 1.5, 0.5, 0.5, "F");

        doc.setTextColor(150, 150, 180);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(metricas[i].label, x + cardW / 2, y + 8, { align: "center" });

        doc.setTextColor(...metricas[i].cor);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(metricas[i].val, x + cardW / 2, y + 17, { align: "center" });
      }

      y += 30;

      // ─── Capturar gráficos do DOM (se elementId fornecido) ─────────────────
      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          try {
            const canvas = await html2canvas(el, {
              backgroundColor: "#0f0f19",
              scale: 1.5,
              useCORS: true,
              logging: false,
            });
            const imgData = canvas.toDataURL("image/png");
            const imgH = (canvas.height / canvas.width) * contentW;
            const maxH = 80;
            const finalH = Math.min(imgH, maxH);
            doc.addImage(imgData, "PNG", margin, y, contentW, finalH);
            y += finalH + 8;
          } catch {
            // html2canvas falhou — continuar sem gráfico
          }
        }
      }

      // ─── Seção: Desempenho por Mercado ─────────────────────────────────────
      if (dados.mercados.length > 0) {
        // Título da seção
        doc.setFillColor(...cinzaMedio);
        doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
        doc.setTextColor(...primario);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("📈 Desempenho por Mercado", margin + 4, y + 5.5);
        y += 12;

        // Cabeçalho da tabela
        const colW = [contentW * 0.35, contentW * 0.15, contentW * 0.15, contentW * 0.15, contentW * 0.2];
        const cols = ["Mercado", "Total", "Acertos", "Taxa", "Score Médio"];
        doc.setFillColor(25, 25, 40);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(120, 120, 160);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        let cx = margin + 2;
        for (let i = 0; i < cols.length; i++) {
          doc.text(cols[i], cx, y + 4.5);
          cx += colW[i];
        }
        y += 7;

        // Linhas da tabela
        for (const m of dados.mercados.slice(0, 12)) {
          if (y > pageH - 30) {
            doc.addPage();
            doc.setFillColor(...cinzaEscuro);
            doc.rect(0, 0, pageW, pageH, "F");
            y = margin;
          }

          const rowColor = dados.mercados.indexOf(m) % 2 === 0 ? cinzaEscuro : [18, 18, 30] as [number, number, number];
          doc.setFillColor(...rowColor);
          doc.rect(margin, y, contentW, 6.5, "F");

          const taxaCor: [number, number, number] = m.taxa >= 60 ? verde : m.taxa >= 45 ? amarelo : vermelho;

          doc.setTextColor(...branco);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          cx = margin + 2;
          doc.text(m.tipo.substring(0, 28), cx, y + 4.5);
          cx += colW[0];
          doc.text(String(m.total), cx, y + 4.5);
          cx += colW[1];
          doc.text(String(m.acertos), cx, y + 4.5);
          cx += colW[2];
          doc.setTextColor(...taxaCor);
          doc.setFont("helvetica", "bold");
          doc.text(`${m.taxa.toFixed(1)}%`, cx, y + 4.5);
          cx += colW[3];
          doc.setTextColor(...branco);
          doc.setFont("helvetica", "normal");
          doc.text(`${m.scoreMedio.toFixed(0)}/100`, cx, y + 4.5);
          y += 6.5;
        }
        y += 8;
      }

      // ─── Seção: Desempenho por Liga ────────────────────────────────────────
      if (dados.ligas.length > 0) {
        if (y > pageH - 60) {
          doc.addPage();
          doc.setFillColor(...cinzaEscuro);
          doc.rect(0, 0, pageW, pageH, "F");
          y = margin;
        }

        doc.setFillColor(...cinzaMedio);
        doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
        doc.setTextColor(...primario);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("🏆 Desempenho por Liga", margin + 4, y + 5.5);
        y += 12;

        const colW2 = [contentW * 0.3, contentW * 0.12, contentW * 0.12, contentW * 0.12, contentW * 0.15, contentW * 0.19];
        const cols2 = ["Liga", "Total", "Greens", "Reds", "Taxa", "Odd Média"];
        doc.setFillColor(25, 25, 40);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(120, 120, 160);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        let cx2 = margin + 2;
        for (let i = 0; i < cols2.length; i++) {
          doc.text(cols2[i], cx2, y + 4.5);
          cx2 += colW2[i];
        }
        y += 7;

        for (const l of dados.ligas.slice(0, 15)) {
          if (y > pageH - 25) {
            doc.addPage();
            doc.setFillColor(...cinzaEscuro);
            doc.rect(0, 0, pageW, pageH, "F");
            y = margin;
          }

          const rowColor = dados.ligas.indexOf(l) % 2 === 0 ? cinzaEscuro : [18, 18, 30] as [number, number, number];
          doc.setFillColor(...rowColor);
          doc.rect(margin, y, contentW, 6.5, "F");

          const taxaCor: [number, number, number] = l.taxaAcerto >= 60 ? verde : l.taxaAcerto >= 45 ? amarelo : vermelho;

          doc.setTextColor(...branco);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          cx2 = margin + 2;
          doc.text(l.liga.substring(0, 22), cx2, y + 4.5);
          cx2 += colW2[0];
          doc.text(String(l.total), cx2, y + 4.5);
          cx2 += colW2[1];
          doc.setTextColor(...verde);
          doc.text(String(l.greens), cx2, y + 4.5);
          cx2 += colW2[2];
          doc.setTextColor(...vermelho);
          doc.text(String(l.reds), cx2, y + 4.5);
          cx2 += colW2[3];
          doc.setTextColor(...taxaCor);
          doc.setFont("helvetica", "bold");
          doc.text(`${l.taxaAcerto.toFixed(1)}%`, cx2, y + 4.5);
          cx2 += colW2[4];
          doc.setTextColor(...branco);
          doc.setFont("helvetica", "normal");
          doc.text(l.oddMedia > 0 ? l.oddMedia.toFixed(2) : "—", cx2, y + 4.5);
          y += 6.5;
        }
        y += 8;
      }

      // ─── Rodapé ────────────────────────────────────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...primario);
        doc.rect(0, pageH - 1.5, pageW, 1.5, "F");
        doc.setTextColor(80, 80, 100);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("RAPHA GURU — Plataforma de Análise Esportiva com IA", margin, pageH - 5);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 5, { align: "right" });
      }

      // ─── Salvar ────────────────────────────────────────────────────────────
      const filename = `rapha-guru-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } finally {
      setGerando(false);
    }
  }, []);

  return { gerarPDF, gerando };
}
