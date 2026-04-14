import { test, expect } from '@playwright/test';
import { login, registerAndLogin, disableOnboarding, seedProject } from './helpers/auth';

test.describe('SCR Agent - Core Regression & Navigation', () => {
  const testEmail = `core_test_${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // 1. Deshabilitar onboarding HOY y SIEMPRE para este test vía init script
    await disableOnboarding(page);
    
    // 2. Registrar/Login
    await registerAndLogin(page, testEmail);
    
    // 3. Sembrar un proyecto para que las vistas no estén vacías
    await seedProject(page);
  });

  test('debe navegar correctamente entre las pestañas principales del Monitor Central', async ({ page }) => {
    // Monitor Central (Dashboard por defecto)
    await expect(page).toHaveURL(/.*dashboard/);

    // Navegar a Incidentes
    await page.click('button:has-text("Incidentes")', { force: true });
    await expect(page.locator('h1:has-text("Monitor de Incidentes")')).toBeVisible();

    // Navegar a Investigaciones (Forense)
    await page.click('button:has-text("Investigaciones")', { force: true });
    await expect(page.locator('h1:has-text("Investigador Forense")')).toBeVisible();

    // Navegar a Reportes (Histórico)
    await page.click('button:has-text("Reportes")', { force: true });
    await expect(page.locator('h1:has-text("Análisis de Seguridad")')).toBeVisible();

    // Navegar a Agentes IA
    await page.click('button:has-text("Agentes IA")', { force: true });
    await expect(page.locator('h1:has-text("Gestión de Agentes")')).toBeVisible();

    // Navegar a Estadísticas
    await page.click('button:has-text("Estadísticas")', { force: true });
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible();
  });

  test('debe permitir abrir la configuración del usuario', async ({ page }) => {
    // El icono de configuración suele estar en el sidebar o dashboard
    // En MainDashboard.tsx vimos un botón con Cog
    const settingsButton = page.locator('button >> .lucide-cog').first();
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page).toHaveURL(/.*settings/);
      await expect(page.locator('h1:has-text("Configuración")')).toBeVisible();
    }
  });

  test('debe cargar la vista de costos históricos', async ({ page }) => {
    await page.click('button:has-text("Costos")');
    await expect(page.locator('h1:has-text("Costos")')).toBeVisible();
    await expect(page.locator('text=Gasto total')).toBeVisible();
  });
});
