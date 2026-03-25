import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatisticsDashboard } from "./StatisticsDashboard";

describe("StatisticsDashboard", () => {
  const defaultProps = {
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    homeScore: 2,
    awayScore: 1,
    possession: { home: 65, away: 35 },
    shots: { home: 8, away: 6 },
    corners: { home: 5, away: 3 },
    cards: { home: 1, away: 0 },
    minute: 45,
  };

  it("should render statistics dashboard", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Expected Goals/)).toBeInTheDocument();
  });

  it("should display xG section", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Expected Goals/)).toBeInTheDocument();
    expect(screen.getByText(/Eficiência/)).toBeInTheDocument();
  });

  it("should display pressure section", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Pressão e Intensidade/)).toBeInTheDocument();
  });

  it("should display historical evolution", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Evolução do Jogo/)).toBeInTheDocument();
  });

  it("should display pass distribution", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Distribuição de Passes/)).toBeInTheDocument();
  });

  it("should display general comparison", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Comparação Geral/)).toBeInTheDocument();
  });

  it("should display possession stats", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Posse de Bola/)).toBeInTheDocument();
    expect(screen.getByText(/65%/)).toBeInTheDocument();
  });

  it("should display shots stats", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Chutes/)).toBeInTheDocument();
  });

  it("should display corners stats", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Escanteios/)).toBeInTheDocument();
  });

  it("should display cards stats", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Cartões/)).toBeInTheDocument();
  });

  it("should display tactical analysis", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Análise Tática/)).toBeInTheDocument();
  });

  it("should calculate efficiency correctly", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    // With 2 goals and 1.8 xG, efficiency should be ~111%
    expect(screen.getByText(/111/)).toBeInTheDocument();
  });

  it("should handle zero goals", () => {
    render(
      <StatisticsDashboard
        {...defaultProps}
        homeScore={0}
        awayScore={0}
      />
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("should display team names correctly", () => {
    render(<StatisticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Manchester/)).toBeInTheDocument();
    expect(screen.getByText(/Liverpool/)).toBeInTheDocument();
  });
});
