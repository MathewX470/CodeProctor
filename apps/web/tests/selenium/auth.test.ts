import { Builder, By, until, WebDriver } from 'selenium-webdriver';

describe('Authentication Flow', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should show an error when logging in with invalid credentials', async () => {
    // 1. Navigate to the login page
    await driver.get('http://localhost:3000/login');

    // 2. Wait for the email input to be present and visible
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
    const passwordInput = await driver.wait(until.elementLocated(By.id('password')), 5000);
    const submitBtn = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);

    // 3. Enter credentials
    await emailInput.sendKeys('test-invalid-user@example.com');
    await passwordInput.sendKeys('wrongpassword123');

    // 4. Click the login button
    await submitBtn.click();

    // 5. Wait for the error toast to appear.
    // In React, text is often nested in spans. Using `.` instead of `text()` searches all descendants.
    const toastError = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(., 'Sign in failed') or contains(., 'Connection error')]")),
      10000
    );

    // 6. Assert the text is visible
    const errorText = await toastError.getText();
    expect(errorText).toBeTruthy();
  });
});
