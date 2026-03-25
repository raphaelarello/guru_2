import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Sheet } from "lucide-react";

interface PlayerStats {
  playerId: number;
  playerName: string;
  teamName: string;
  leagueName: string;
  gols: number;
  assistencias: number;
  cartoes: number;
  amarelos?: number;
  vermelhos?: number;
  eficiencia: number;
  consistencia: number;
  percentilLiga: number;
}

interface ExportarRelatorioProps {
  artilheiros: PlayerStats[];
  indisciplinados: PlayerStats[];
  data: string;
}

export function ExportarRelatorio({
  artilheiros,
  indisciplinados,
  data,
}: ExportarRelatorioProps) {
  // Exportar como CSV
  const exportarCSV = () => {
    const linhas: string[] = [];

    // Cabeçalho
    linhas.push("RELATÓRIO DE ARTILHEIROS E INDISCIPLINADOS");
    linhas.push(`Data: ${new Date(data).toLocaleDateString("pt-BR")}`);
    linhas.push("");

    // Seção Artilheiros
    linhas.push("=== ARTILHEIROS ===");
    linhas.push(
      "Posição,Nome,Time,Liga,Gols,Assistências,Eficiência,Consistência,Percentil"
    );

    artilheiros.forEach((player, idx) => {
      linhas.push(
        `${idx + 1},"${player.playerName}","${player.teamName}","${player.leagueName}",${player.gols},${player.assistencias},${player.eficiencia.toFixed(1)},${player.consistencia},${player.percentilLiga}`
      );
    });

    linhas.push("");
    linhas.push("=== INDISCIPLINADOS ===");
    linhas.push(
      "Posição,Nome,Time,Liga,Cartões,Amarelos,Vermelhos"
    );

    indisciplinados.forEach((player, idx) => {
      linhas.push(
        `${idx + 1},"${player.playerName}","${player.teamName}","${player.leagueName}",${player.cartoes},${player.amarelos || 0},${player.vermelhos || 0}`
      );
    });

    // Criar arquivo
    const conteudo = linhas.join("\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `relatorio-artilheiros-${data}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar como PDF
  const exportarPDF = async () => {
    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();
      let yPosition = 10;

      // Título
      doc.setFontSize(16);
      doc.text("Relatório de Artilheiros e Indisciplinados", 14, yPosition);
      yPosition += 10;

      // Data
      doc.setFontSize(10);
      doc.text(
        `Data: ${new Date(data).toLocaleDateString("pt-BR")}`,
        14,
        yPosition
      );
      yPosition += 8;

      // Seção Artilheiros
      doc.setFontSize(12);
      doc.text("ARTILHEIROS", 14, yPosition);
      yPosition += 6;

      const artilheirosData = artilheiros.map((p, idx) => [
        idx + 1,
        p.playerName,
        p.teamName,
        p.leagueName,
        p.gols,
        p.assistencias,
        p.eficiencia.toFixed(1) + "%",
        p.consistencia + "%",
        p.percentilLiga + "%",
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [
          [
            "Pos",
            "Nome",
            "Time",
            "Liga",
            "Gols",
            "Assist.",
            "Efic.",
            "Consist.",
            "Percentil",
          ],
        ],
        body: artilheirosData,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { halign: "center", cellWidth: 12 },
          5: { halign: "center", cellWidth: 15 },
          6: { halign: "center", cellWidth: 15 },
          7: { halign: "center", cellWidth: 15 },
          8: { halign: "center", cellWidth: 15 },
        },
      });

      // Adicionar página se necessário
      const lastTable = (doc as any).lastAutoTable;
      if (lastTable && lastTable.finalY > 250) {
        doc.addPage();
        yPosition = 10;
      } else if (lastTable) {
        yPosition = lastTable.finalY + 15;
      } else {
        yPosition = 150;
      }

      // Seção Indisciplinados
      doc.setFontSize(12);
      doc.text("INDISCIPLINADOS", 14, yPosition);
      yPosition += 6;

      const indisciplinadosData = indisciplinados.map((p, idx) => [
        idx + 1,
        p.playerName,
        p.teamName,
        p.leagueName,
        p.cartoes,
        p.amarelos || 0,
        p.vermelhos || 0,
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [["Pos", "Nome", "Time", "Liga", "Cartões", "Amarelos", "Vermelhos"]],
        body: indisciplinadosData,
        theme: "grid",
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { halign: "center", cellWidth: 20 },
          5: { halign: "center", cellWidth: 20 },
          6: { halign: "center", cellWidth: 20 },
        },
      });

      // Salvar
      doc.save(`relatorio-artilheiros-${data}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao exportar PDF. Tente novamente.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 hover:bg-slate-800"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-slate-700">
        <DropdownMenuItem
          onClick={exportarCSV}
          className="cursor-pointer hover:bg-slate-700"
        >
          <Sheet className="w-4 h-4 mr-2 text-green-400" />
          <span>Exportar como CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportarPDF}
          className="cursor-pointer hover:bg-slate-700"
        >
          <FileText className="w-4 h-4 mr-2 text-red-400" />
          <span>Exportar como PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
