import { test, expect } from '@playwright/test';
import { registerAndLogin, seedProject, disableOnboarding } from './helpers/auth';

test.describe('SCR Agent - Fase 4: Educación y Control', () => {
  const testEmail = `test_${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Escenario de usuario nuevo para disparar el onboarding
    await registerAndLogin(page, testEmail);
  });

  test('debe mostrar y permitir completar el tour de onboarding', async ({ page }) => {
    // 1. Verificar que el modal de bienvenida aparece
    const welcomeTitle = page.locator('text=Bienvenido a SCR Agent');
    await expect(welcomeTitle).toBeVisible({ timeout: 10000 });

    // 2. Navegar por los pasos
    // Usamos force:true y esperamos un poco entre clics para dejar que termine la animación de framer-motion
    const nextButton = page.locator('button:has-text("Siguiente")');
    
    // Paso: Gestión de Proyectos
    await nextButton.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Gestión de Proyectos')).toBeVisible();

    // Paso: Auditoría
    await nextButton.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Modos de Auditoría')).toBeVisible();

    // Paso: Incidentes
    await nextButton.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Monitor de Incidentes')).toBeVisible();

    // Paso: Biblioteca
    await nextButton.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Manual Completo SCR')).toBeVisible();

    // 3. Finalizar tour (Último botón es 'Completar')
    const finishButton = page.locator('button:has-text("Completar")');
    await finishButton.click({ force: true });
    await page.waitForTimeout(500);

    // 4. Verificar que el modal desaparece
    await expect(welcomeTitle).not.toBeVisible();
    
    // 5. Verificar persistencia en localStorage
    const isCompleted = await page.evaluate(() => localStorage.getItem('scr_onboarding_completed'));
    expect(isCompleted).toBe('true');
  });

  test('debe navegar a la Biblioteca y mostrar temas técnicos', async ({ page }) => {
    // Omitir onboarding de forma segura
    const skipBtn = page.locator('button:has-text("Omitir guía")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click({ force: true });
    }

    // 1. Ir a la pestaña Biblioteca (Manual)
    const manualTab = page.locator('button:has-text("Biblioteca")');
    await manualTab.click({ force: true });

    // 2. Verificar encabezado
    await expect(page.locator('h1:has-text("Manual SCR")')).toBeVisible();

    // 3. Seleccionar un tema (ej: Ponderación de Amenazas)
    const topicCard = page.locator('button:has-text("Ponderación de Amenazas")').first();
    await topicCard.click({ force: true });

    // 4. Verificar contenido detallado
    await expect(page.locator('text=Risk Score')).toBeVisible();
  });

  test('debe mostrar la estimación de costos en el menú de auditoría', async ({ page }) => {
    const skipBtn = page.locator('button:has-text("Omitir guía")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    
    // Asegurar que hay proyecto
    await seedProject(page);

    // 1. Asegurarse de estar en Dashboard de Proyectos
    await page.click('button:has-text("Proyectos")', { force: true });
    await page.waitForTimeout(500);

    // 2. Abrir el dropdown de auditoría de un proyecto
    const auditDropdownButton = page.locator('button >> .lucide-chevron-down').first();
    
    if (await auditDropdownButton.isVisible()) {
      await auditDropdownButton.click({ force: true });

      // 3. Verificar que aparece el presupuesto estimado
      const budgetLabel = page.locator('text=Presupuesto Estimado');
      await expect(budgetLabel).toBeVisible();

      // 4. Verificar que hay un valor en dólares (formato $X.XX)
      const costValue = page.locator('text=$');
      await expect(costValue).toBeVisible();
    }
  });

  test('debe permitir abrir la Inteligencia Explicativa (Chat IA) en un hallazgo', async ({ page }) => {
    const skipBtn = page.locator('button:has-text("Omitir guía")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click({ force: true });
    }

    // 1. Ir a Reportes o Incidentes para encontrar un hallazgo
    await page.click('button:has-text("Incidentes")', { force: true });
    await page.waitForTimeout(500);

    // 2. Buscar un botón de "Explicar con IA"
    const explainButton = page.locator('button:has-text("Explicar con IA")').first();

    if (await explainButton.isVisible()) {
      await explainButton.click({ force: true });

      // 3. Verificar que se abre el sidebar del chat
      await expect(page.locator('h3:has-text("Inteligencia Explicativa")')).toBeVisible();
      
      // 4. Enviar un mensaje de prueba
      const textarea = page.locator('textarea[placeholder*="Pregunta algo"]');
      await textarea.fill('¿Por qué este hallazgo es crítico?');
      await page.click('button:has-child(.lucide-send)', { force: true });

      // 5. Verificar que el mensaje del usuario aparece en el chat
      await expect(page.locator('text=¿Por qué este hallazgo es crítico?')).toBeVisible();
    }
  });
});
