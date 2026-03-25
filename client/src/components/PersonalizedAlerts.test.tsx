import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonalizedAlerts } from "./PersonalizedAlerts";

describe("PersonalizedAlerts", () => {
  it("should render alerts modal", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Alertas Personalizados/)).toBeInTheDocument();
  });

  it("should display favorite teams section", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Times Favoritos/)).toBeInTheDocument();
  });

  it("should display favorite leagues section", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Ligas Favoritas/)).toBeInTheDocument();
  });

  it("should display alert types section", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Tipos de Alertas/)).toBeInTheDocument();
  });

  it("should display goals alert option", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Gols/)).toBeInTheDocument();
  });

  it("should display cards alert option", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Cartões/)).toBeInTheDocument();
  });

  it("should display corners alert option", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Escanteios/)).toBeInTheDocument();
  });

  it("should display substitutions alert option", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Substituições/)).toBeInTheDocument();
  });

  it("should display odds changes alert option", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Mudanças de Odds/)).toBeInTheDocument();
  });

  it("should display sound settings", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Som nas Notificações/)).toBeInTheDocument();
  });

  it("should display summary section", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Resumo de Alertas/)).toBeInTheDocument();
  });

  it("should display save button", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Salvar Configurações/)).toBeInTheDocument();
  });

  it("should display cancel button when onClose is provided", () => {
    const onClose = vi.fn();
    render(<PersonalizedAlerts onClose={onClose} />);
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("should call onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<PersonalizedAlerts onClose={onClose} />);
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("should display team selection dropdown", () => {
    render(<PersonalizedAlerts />);
    const selects = screen.getAllByText(/Selecionar time/);
    expect(selects.length).toBeGreaterThan(0);
  });

  it("should display league selection dropdown", () => {
    render(<PersonalizedAlerts />);
    const selects = screen.getAllByText(/Selecionar liga/);
    expect(selects.length).toBeGreaterThan(0);
  });

  it("should have default favorite teams", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Manchester City/)).toBeInTheDocument();
    expect(screen.getByText(/Liverpool/)).toBeInTheDocument();
  });

  it("should have default favorite leagues", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Premier League/)).toBeInTheDocument();
    expect(screen.getByText(/Champions League/)).toBeInTheDocument();
  });

  it("should display add team button", () => {
    render(<PersonalizedAlerts />);
    const buttons = screen.getAllByText("Adicionar");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should display configuration summary with team count", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/2 times/)).toBeInTheDocument();
  });

  it("should display configuration summary with league count", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/2 ligas/)).toBeInTheDocument();
  });

  it("should display sound status in summary", () => {
    render(<PersonalizedAlerts />);
    expect(screen.getByText(/Som: Ativado/)).toBeInTheDocument();
  });
});
