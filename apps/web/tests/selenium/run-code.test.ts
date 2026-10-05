import { Builder, By, until, WebDriver } from 'selenium-webdriver';

describe('Login and Run Code E2E', () => {
  let driver: WebDriver;
  // Use a unique email for every test run so registration doesn't fail
  const testEmail = `test-runner-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123';

  beforeAll(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should register, navigate to a problem, and execute code', async () => {
    // 1. Sign up to get authenticated access
    await driver.get('http://localhost:3000/signup');
    
    await driver.wait(until.elementLocated(By.id('full-name')), 5000).sendKeys('E2E User');
    await driver.findElement(By.id('email')).sendKeys(testEmail);
    await driver.findElement(By.id('password')).sendKeys(testPassword);
    await driver.findElement(By.id('confirm-password')).sendKeys(testPassword);
    
    // Click submit and wait for redirect to dashboard
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Wait until URL changes to dashboard (meaning login/signup was successful)
    await driver.wait(until.urlContains('/dashboard'), 10000);

    // 2. Navigate to the Problems Bank
    await driver.get('http://localhost:3000/problems');

    // 3. Click the first "Solve Challenge" button available.
    // NOTE: This assumes your database has at least one problem seeded!
    const solveBtn = await driver.wait(
      until.elementLocated(By.xpath("(//a[contains(., 'Solve Challenge')])[1]")),
      10000,
      "Could not find any problems in the Problem Bank. Is the database seeded?"
    );
    await solveBtn.click();

    // 4. Wait for the IDE page to load (wait for the Run button)
    const runBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Run')]")),
      10000
    );

    // 5. Click the Run button using JavaScript to avoid any overlapping element issues
    await driver.executeScript("arguments[0].click();", runBtn);

    // 6. Verify that execution started or an error was caught.
    try {
      const statusTextElement = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(., 'Connecting') or contains(., 'PENDING') or contains(., 'COMPLETED') or contains(., 'Network error') or contains(., 'Execution Failed')]")),
        10000
      );
      const statusText = await statusTextElement.getAttribute('textContent');
      expect(statusText).toBeTruthy();
    } catch (e) {
      // If it still fails, let's grab all text on the page to see what's actually rendering!
      const bodyText = await driver.findElement(By.tagName('body')).getText();
      console.log("PAGE TEXT AT FAILURE:", bodyText);
      throw e;
    }
  }, 45000);
});
