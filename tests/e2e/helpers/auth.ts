import { Page, expect } from '@playwright/test';

/**
 * Helper to register and login a new test user
 */
export async function registerAndLogin(page: Page, email: string, name: string = 'Test User') {
  await page.goto('/login');
  
  // Switch to register mode
  await page.click('button:has-text("Crear cuenta")');
  
  // Fill registration form
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Password123!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success and redirect (LoginPage handles 1.2s timeout)
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to login with existing credentials
 */
export async function login(page: Page, email: string) {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'Password123!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success and redirect
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to disable onboarding by seeding localStorage before page load
 */
export async function disableOnboarding(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('scr_onboarding_completed', 'true');
  });
}

/**
 * Helper to create a test project if none exists
 */
export async function seedProject(page: Page) {
  // Asegurarse de estar en Dashboard de Proyectos
  await page.click('button:has-text("Proyectos")');
  
  // Si vemos el estado vacío, creamos uno básico
  const emptyState = page.locator('text=Sin proyectos vinculados | text=Vincular repositorio');
  if (await emptyState.count() > 0) {
     const addBtn = page.locator('button:has-text("Vincular") | button:has-child(.lucide-plus)').first();
     if (await addBtn.isVisible()) {
       await addBtn.click({ force: true });
       const modal = page.locator('h2:has-text("Vincular")');
       if (await modal.isVisible()) {
         await page.fill('input[placeholder*="Nombre"]', 'Test Repo E2E');
         await page.fill('input[placeholder*="URL"]', 'https://github.com/test/repo');
         await page.click('button:has-text("Vincular")');
         await page.waitForTimeout(2000);
         await page.waitForLoadState('networkidle');
       }
     }
  }
}
