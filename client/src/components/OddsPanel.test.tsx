import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OddsPanel } from "./OddsPanel";

describe("OddsPanel", () => {
  it("should render odds panel with home team", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Manchester City/)).toBeInTheDocument();
  });

  it("should render odds panel with away team", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Liverpool/)).toBeInTheDocument();
  });

  it("should display bookmaker options", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText("Betfair")).toBeInTheDocument();
    expect(screen.getByText("Pinnacle")).toBeInTheDocument();
  });

  it("should display odds values", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText("1.85")).toBeInTheDocument();
    expect(screen.getByText("3.60")).toBeInTheDocument();
    expect(screen.getByText("2.05")).toBeInTheDocument();
  });

  it("should display value betting analysis", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Value/i)).toBeInTheDocument();
  });

  it("should display over/under options", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Over 2.5/)).toBeInTheDocument();
    expect(screen.getByText(/Under 2.5/)).toBeInTheDocument();
  });

  it("should display both teams score options", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Ambos Marcam/)).toBeInTheDocument();
  });

  it("should display odds comparison", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Melhor Odd/)).toBeInTheDocument();
  });

  it("should display odds movement analysis", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Movimento de Odds/)).toBeInTheDocument();
  });

  it("should display value opportunities", () => {
    render(
      <OddsPanel
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        homeScore={2}
        awayScore={1}
        minute={45}
      />
    );

    expect(screen.getByText(/Oportunidades de Value/)).toBeInTheDocument();
  });
});
